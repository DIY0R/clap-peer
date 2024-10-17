'use strict';
const { createData, uuid, createMessage } = require('./common');
const Connection = require('./connection');
const {
  HANDSHAKE,
  DM,
  CHECK_INTERVAL,
  TIMEOUT_DURATION,
  TIMEOUT_ERROR_MESSAGE,
} = require('./constants');

class Messaging extends Connection {
  NODE_ID = uuid();
  neighbors = new Map();

  constructor(port, targetNode, nodeId) {
    super(port, targetNode);
    if (nodeId) this.NODE_ID = nodeId;
  }

  _newConnection(connectionId) {
    this._send(connectionId, createData(HANDSHAKE, this.NODE_ID));
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

  async send(nodeId, message) {
    await this.#neighborCheck();
    const connectionId = this.neighbors.get(nodeId);
    const targets = connectionId ? [connectionId] : this.neighbors;
    targets.forEach(target =>
      this._send(target, createMessage(DM, nodeId, message)),
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
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(Error(TIMEOUT_ERROR_MESSAGE)), TIMEOUT_DURATION),
    );
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
    const { data, to } = messageObject;
    if (to !== this.NODE_ID) return this.send(to, data);
    this.emit(DM, data);
  }
}

module.exports = Messaging;
