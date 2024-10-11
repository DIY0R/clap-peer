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
    const { type, data, to } = messageObject;
    this[type](data);
    if (type === HANDSHAKE) {
      this.#addNeighbor(connectionId, data);
    }
    if (type === DM) {
      if (to !== this.NODE_ID) return this.send(to, data);
      this.emit(DM, data);
    }
  }

  _deleteConnection(connectionId) {
    const nodeId = this.#findNodeId(connectionId);
    if (nodeId) this.neighbors.delete(connectionId);
  }

  send(nodeId, message) {
    const connectionId = this.neighbors.get(nodeId);
    if (connectionId)
      return this._send(
        connectionId,
        createMessage({ type: DM, data: message, to: nodeId }),
      );
    this.neighbors.forEach(connectionId => this._send(connectionId, message));
  }

  #findNodeId(connectionId) {
    for (let [nodeId, NodeConnectionId] of this.neighbors) {
      if (connectionId === NodeConnectionId) return nodeId;
    }
  }

  #addNeighbor(connectionId, neighbor) {
    this.neighbors.set(neighbor, connectionId);
    console.log(this.neighbors.get(neighbor));
  }
}

module.exports = Messaging;
