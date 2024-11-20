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
    const isHasKey = this.getTargetNodeKey(targetNode);
    return new Promise((resolve, reject) => {
      if (isHasKey) return resolve(isHasKey);
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

  encryptMessage(message) {
    return crypto.publicEncrypt(this.publicKey, Buffer.from(message));
  }

  decryptMessage(encryptedMessage) {
    return crypto.privateDecrypt(this.#privateKey, encryptedMessage).toString();
  }

  getTargetNodeKey(nodeId) {
    const publicKey = this._nodePublicKeys.get(nodeId);
    if (publicKey) return publicKey;
  }

  deleteNodeKey(nodeId) {
    return this._nodePublicKeys.delete(nodeId);
  }
}

module.exports = CryptoRSA;
