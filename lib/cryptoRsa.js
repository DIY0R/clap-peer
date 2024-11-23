'use strict';
const crypto = require('crypto');
const EventEmitter = require('events');
const Connection = require('./connection');
const { createMessage, uuid } = require('./common');
const {
  PUBLIC_KEY_RESPONSE,
  TTL,
  PUBLIC_KEY_REQUEST,
  DEFAULT_TIMEOUT,
  TIMEOUT_ERROR,
  CRYPTO_DM,
} = require('./constants');

class CryptoRSA extends Connection {
  publicKey = '';
  #privateKey = '';
  _nodePublicKeys = new Map();
  #responseEmitter = new EventEmitter();

  constructor(port, targetNode) {
    super(port, targetNode);
    this.#generateKeys();
  }

  #generateKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    this.publicKey = publicKey;
    this.#privateKey = privateKey;
  }

  _requestPublicKey(targetNode) {
    const publicKey = this.getTargetNodeKey(targetNode);
    return new Promise((resolve, reject) => {
      if (publicKey) return resolve(publicKey);
      const messageId = uuid();
      const timerId = setTimeout(
        () => reject(new Error(TIMEOUT_ERROR)),
        DEFAULT_TIMEOUT,
      );
      this.#responseEmitter.once(messageId, key => {
        clearTimeout(timerId);
        resolve(key);
      });
      const options = createMessage(
        PUBLIC_KEY_REQUEST,
        targetNode,
        this.nodeId,
        messageId,
        TTL,
      );
      this._broadcast(options);
    });
  }

  _generateCryptoMessage(message, publicKey) {
    const symKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const aesCipher = crypto.createCipheriv('aes-256-cbc', symKey, iv);
    let encryptedMessage =
      aesCipher.update(JSON.stringify(message), 'utf8', 'base64') +
      aesCipher.final('base64');
    const encryptedSymKey = crypto.publicEncrypt(publicKey, symKey);
    return { encryptedMessage, encryptedSymKey, iv };
  }

  #decryptMessage(message) {
    const { encryptedMessage, encryptedSymKey, iv } = message;
    const decryptedSymKey = crypto.privateDecrypt(
      this.#privateKey,
      Buffer.from(encryptedSymKey, 'base64'),
    );
    const aesDecipher = crypto.createDecipheriv(
      'aes-256-cbc',
      decryptedSymKey,
      Buffer.from(iv, 'base64'),
    );
    let decryptedMessage =
      aesDecipher.update(encryptedMessage, 'base64', 'utf8') +
      aesDecipher.final('utf8');
    return decryptedMessage;
  }

  getTargetNodeKey(nodeId) {
    const publicKey = this._nodePublicKeys.get(nodeId);
    if (publicKey) return publicKey;
  }

  deleteNodeKey(nodeId) {
    return this._nodePublicKeys.delete(nodeId);
  }

  [CRYPTO_DM](_, messageData) {
    const processedMessage = this._processMessage(messageData, CRYPTO_DM);
    if (processedMessage) {
      const message = this.#decryptMessage(processedMessage.message);
      this.emit(CRYPTO_DM, { ...processedMessage, message });
    }
  }

  [PUBLIC_KEY_REQUEST](_, messageData) {
    const processedMessage = this._processMessage(
      messageData,
      PUBLIC_KEY_REQUEST,
    );
    if (!processedMessage) return;
    const fromNode = processedMessage.fromNode;
    const messageId = uuid();
    const message = {
      messageId: processedMessage.messageId,
      publicKey: this.publicKey,
    };
    const options = createMessage(
      PUBLIC_KEY_RESPONSE,
      fromNode,
      this.nodeId,
      messageId,
      TTL,
      message,
    );
    this._broadcast(options);
  }

  [PUBLIC_KEY_RESPONSE](_, messageData) {
    const processedMessage = this._processMessage(
      messageData,
      PUBLIC_KEY_RESPONSE,
    );
    if (!processedMessage) return;
    const { messageId, publicKey } = messageData.message;
    this._nodePublicKeys.set(messageData.fromNode, publicKey);
    this.#responseEmitter.emit(messageId, publicKey);
  }
}

module.exports = CryptoRSA;
