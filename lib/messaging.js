const { createData, uuid } = require('./common');
const Connection = require('./connection');
const { HANDSHAKE } = require('./constants');

class Messaging extends Connection {
  NODE_ID = uuid();
  #neighbors = new Map();

  constructor(port, targetNode) {
    super(port, targetNode);
    this.#start();
  }

  #newConnection(connectionId) {
    this._send(connectionId, createData(HANDSHAKE, this.NODE_ID));
  }

  #addNeighbor(connectionId, messageObject) {
    this.#neighbors.set(messageObject.data, connectionId);
  }

  #onMessage(connectionId, messageObject) {
    if (messageObject.type == HANDSHAKE) {
      this.#addNeighbor(connectionId, messageObject);
    }
  }

  #start() {
    this._onConnect = this.#newConnection;
    this._onData = this.#onMessage;
  }
}

module.exports = Messaging;
