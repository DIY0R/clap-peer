'use strict';
const CryptoRSA = require('./cryptoRsa');
const { createData, uuid, createMessage } = require('./common');
const {
  HANDSHAKE,
  DM,
  CHECK_INTERVAL,
  TIMEOUT_DURATION,
  TIMEOUT_ERROR_MESSAGE,
  TTL,
  TIME_CLEAN_MSG,
  CRYPTO_DM,
} = require('./constants');

class Messaging extends CryptoRSA {
  #NODE_ID = uuid();
  #seenMessages = new Set();
  neighbors = new Map();

  constructor(port, nodePrefix, targetNode) {
    super(port, targetNode);
    this.#init(nodePrefix);
  }

  async publish(targetNode, message) {
    await this.#neighborCheck();
    const messageForm = createMessage(
      DM,
      targetNode,
      this.#NODE_ID,
      uuid(),
      TTL,
      message,
    );
    this._broadcast(messageForm);
  }

  async send(targetNode, message) {
    await this.#neighborCheck();
    const publicKey = await this._requestPublicKey(targetNode);
    const cryptMessage = this._generateCryptoMessage(message, publicKey);
    const messageForm = createMessage(
      CRYPTO_DM,
      targetNode,
      this.#NODE_ID,
      uuid(),
      TTL,
      cryptMessage,
    );
    this._broadcast(messageForm);
  }

  get nodeId() {
    return this.#NODE_ID;
  }

  _broadcast(options) {
    const { targetNode, messageId } = options;
    const connectionId = this.neighbors.get(targetNode);
    const neighbors = connectionId ? [connectionId] : this.neighbors;
    this.#addSeenMessage(messageId);
    neighbors.forEach(neighbor => this._publish(neighbor, options));
  }

  _newConnection(connectionId) {
    this._publish(connectionId, createData(HANDSHAKE, this.#NODE_ID));
  }

  _onMessage(connectionId, messageData) {
    const handler = this[messageData.typeMessage]?.bind(this);
    if (handler) handler(connectionId, messageData);
  }

  _deleteConnection(connectionId) {
    const nodeId = this.#findNodeId(connectionId);
    if (!nodeId) return;
    this.neighbors.delete(nodeId);
    this.deleteNodeKey(nodeId);
  }

  _processMessage(message, typeMessage) {
    const { messageId, targetNode, ttl } = message;
    if (this.#isInvalidMessage(messageId, ttl)) return;
    if (targetNode === this.#NODE_ID) {
      this.#addSeenMessage(messageId);
      return message;
    }
    const options = { ...message, typeMessage, ttl: ttl - 1 };
    this._broadcast(options);
  }

  #findNodeId(connectionId) {
    for (let [nodeId, NodeConnectionId] of this.neighbors) {
      if (connectionId === NodeConnectionId) return nodeId;
    }
  }

  #addNeighbor(connectionId, neighborName) {
    this.neighbors.set(neighborName, connectionId);
  }

  async #neighborCheck() {
    return new Promise((resolve, reject) => {
      if (this.neighbors.size > 0) return resolve();
      const timer = setTimeout(
        () => reject(Error(TIMEOUT_ERROR_MESSAGE)),
        TIMEOUT_DURATION,
      );
      const interval = setInterval(() => {
        if (this.neighbors.size > 0) {
          clearTimeout(timer);
          clearInterval(interval);
          resolve();
        }
      }, CHECK_INTERVAL);
    });
  }

  #isInvalidMessage(messageId, ttl) {
    return ttl < 1 || this.#seenMessages.has(messageId);
  }

  #init(nodePrefix) {
    if (nodePrefix) this.#NODE_ID = nodePrefix + '-' + uuid();
    this.#cleanSeenMessages();
  }

  #addSeenMessage(messageId) {
    this.#seenMessages.add(messageId);
  }

  #cleanSeenMessages() {
    setInterval(() => this.#seenMessages.clear(), TIME_CLEAN_MSG);
  }

  [HANDSHAKE](connectionId, messageData) {
    const { message } = messageData;
    this.#addNeighbor(connectionId, message);
  }

  [DM](_, messageData) {
    const processedMessage = this._processMessage(messageData, DM);
    if (processedMessage) this.emit(DM, processedMessage);
  }
}

module.exports = Messaging;
