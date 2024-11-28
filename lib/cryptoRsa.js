'use strict';
const crypto = require('crypto');
const EventEmitter = require('events');
const Connection = require('./connection');
const { createMessage, uuid, WrappedError } = require('./common');
const {
  PUBLIC_KEY_RESPONSE,
  TTL,
  PUBLIC_KEY_REQUEST,
  DEFAULT_TIMEOUT,
  CRYPTO_DM,
  ERROR,
  TIMEOUT_ERROR_REQUEST,
  DECRYPT_ERROR,
  TWO_DAYS,
} = require('./constants');

class CryptoRSA extends Connection {
  publicKey = '';
  #privateKey = '';
  #responseEmitter = new EventEmitter();
  _nodePublicKeys = new Map();

  constructor(port, targetNode) {
    super(port, targetNode);
    this.#init();
  }

  _requestPublicKey(targetNode) {
    const nodePublic = this.#getTargetNodeKey(targetNode);
    return new Promise((resolve, reject) => {
      if (nodePublic) return resolve(nodePublic.publicKey);
      const messageId = uuid();
      const timerId = setTimeout(
        () => reject(new Error(TIMEOUT_ERROR_REQUEST)),
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
      console.log(options);
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

  _deleteNodeKey(nodeId) {
    return this._nodePublicKeys.delete(nodeId);
  }

  [CRYPTO_DM](_, messageData) {
    const processedMessage = this._processMessage(messageData, CRYPTO_DM);
    if (processedMessage) {
      try {
        const message = this.#decryptMessage(processedMessage.message);
        this.emit(CRYPTO_DM, {
          ...processedMessage,
          message: JSON.parse(message),
        });
      } catch (error) {
        this.emit(
          ERROR,
          new WrappedError(DECRYPT_ERROR, error),
          processedMessage,
        );
      }
    }
  }

  clearPublicKeys(dayInMillis = TWO_DAYS) {
    const now = Date.now();
    this._nodePublicKeys.forEach(({ timestamp }, key) => {
      const timestampMillis = new Date(timestamp).getTime();
      if (now - timestampMillis > dayInMillis) this._deleteNodeKey(key);
    });
  }

  #getTargetNodeKey(nodeId) {
    const publicKey = this._nodePublicKeys.get(nodeId);
    if (publicKey) return publicKey;
  }

  #timerClearKeys() {
    setInterval(this.clearPublicKeys.bind(this), TWO_DAYS);
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
    if (processedMessage) {
      const { messageId, publicKey } = messageData.message;
      this._nodePublicKeys.set(messageData.fromNode, {
        publicKey,
        timestamp: new Date().toISOString(),
      });
      this.#responseEmitter.emit(messageId, publicKey);
    }
  }

  #init() {
    this.#generateKeys();
    this.#timerClearKeys();
  }
}

module.exports = CryptoRSA;
