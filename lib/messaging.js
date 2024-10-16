'use strict';
const { createData, uuid, createMessage } = require('./common');
const Connection = require('./connection');
const { HANDSHAKE, DM } = require('./constants');

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

  send(nodeId, message) {
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
