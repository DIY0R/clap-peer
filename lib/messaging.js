const { createData, uuid } = require('./common');
const Connection = require('./connection');
const { HANDSHAKE } = require('./constants');

class Messaging extends Connection {
  NODE_ID = uuid();
  neighbors = new Map();

  constructor(port, targetNode) {
    super(port, targetNode);
  }

  _newConnection(connectionId) {
    this._send(connectionId, createData(HANDSHAKE, this.NODE_ID));
  }

  #addNeighbor(connectionId, messageObject) {
    this.neighbors.set(messageObject.data, connectionId);
  }

  _onMessage(connectionId, messageObject) {
    if (messageObject.type == HANDSHAKE) {
      console.log(messageObject);
      this.#addNeighbor(connectionId, messageObject);
    }
  }
}

module.exports = Messaging;
