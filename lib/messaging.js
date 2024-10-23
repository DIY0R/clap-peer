'use strict';
const Connection = require('./connection');
const { createData, uuid, createMessage } = require('./common');
const {
  HANDSHAKE,
  DM,
  CHECK_INTERVAL,
  TIMEOUT_DURATION,
  TIMEOUT_ERROR_MESSAGE,
  TTL,
  TIME_CLEAN_MSG,
} = require('./constants');

class Messaging extends Connection {
  NODE_ID = uuid();
  neighbors = new Map();
  seenMessages = new Set('sd', 'sd');

  constructor(port, nodeId, targetNode) {
    super(port, targetNode);
    if (nodeId) this.NODE_ID = nodeId;
    this.#cleanSeenMessages();
  }

  _newConnection(connectionId) {
    this._publish(connectionId, createData(HANDSHAKE, this.NODE_ID));
  }

  _onMessage(connectionId, messageObject) {
    const { type } = messageObject;
    const handler = this[type]?.bind(this);
    if (handler) handler(connectionId, messageObject);
  }

  _deleteConnection(connectionId) {
    const nodeId = this.#findNodeId(connectionId);
    if (nodeId) this.neighbors.delete(connectionId);
  }

  async publish(nodeId, message) {
    await this.#neighborCheck();
    this.#broadcast(nodeId, message);
  }

  #broadcast(nodeId, message, param) {
    const { messageId = uuid(), ttl = TTL } = param || {};
    const connectionId = this.neighbors.get(nodeId);
    const targets = connectionId ? [connectionId] : this.neighbors;
    this.seenMessages.add(messageId);
    targets.forEach(target =>
      this._publish(
        target,
        createMessage({ type: DM, to: nodeId, messageId, message, ttl }),
      ),
    );
  }

  #findNodeId(connectionId) {
    for (let [nodeId, NodeConnectionId] of this.neighbors) {
      if (connectionId === NodeConnectionId) return nodeId;
    }
  }

  #addNeighbor(connectionId, neighbor) {
    this.neighbors.set(neighbor, connectionId);
  }

  async #neighborCheck() {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(Error(TIMEOUT_ERROR_MESSAGE)), TIMEOUT_DURATION);
    });
    const checkNeighbors = async () => {
      while (this.neighbors.size === 0) {
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      }
    };
    await Promise.race([checkNeighbors(), timeoutPromise]);
  }

  [HANDSHAKE](connectionId, messageObject) {
    const { data } = messageObject;
    this.#addNeighbor(connectionId, data);
  }

  [DM](_, messageObject) {
    const { messageId, data, to, ttl } = messageObject;
    if (to === this.NODE_ID) return void this.emit(DM, data);
    const isSeenMessage = this.seenMessages.has(messageId);
    if (ttl < 1 || isSeenMessage) return;
    this.#broadcast(to, data, { messageId, ttl: ttl - 1 });
  }

  #cleanSeenMessages() {
    setTimeout(() => this.seenMessages.clear(), TIME_CLEAN_MSG);
  }
}

module.exports = Messaging;
