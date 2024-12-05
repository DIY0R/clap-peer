'use strict';
const net = require('net');
const { EventEmitter } = require('stream');
const { uuid, serialization, WrappedError } = require('./common');
const collectMessage = require('./chunkProcessor');
const { EVENTS, ERRORS } = require('./constants');

class Connection extends EventEmitter {
  #connections = new Map();

  constructor(port, targetNode) {
    super();
    this.#start(port, targetNode);
  }

  connect(targetNode) {
    const socket = new net.Socket();
    socket.connect(targetNode, () => this.#handleConnection(socket));
  }

  #handleConnection(socket) {
    const connectionId = uuid();
    socket.setNoDelay(false);
    socket.on('close', () => this.#deleteConnection(connectionId));
    socket.on('error', error => this.#errorHandler(error));
    socket
      .pipe(collectMessage())
      .on('data', message => this.#onData(connectionId, message));
    this.#newConnection(connectionId, socket);
  }

  _publish(connectionId, message) {
    const socket = this.#connections.get(connectionId);
    if (!socket) throw new Error(`Node does not exist ${connectionId}`);
    socket.write(serialization(message));
  }

  close() {
    for (let [connectionId, socket] of this.#connections) {
      socket.close();
      this.#deleteConnection(connectionId);
    }
  }

  #deleteConnection(connectionId) {
    this.#connections.delete(connectionId);
    this._deleteConnection(connectionId);
  }

  #newConnection(connectionId, socket) {
    this.#connections.set(connectionId, socket);
    this._newConnection(connectionId);
  }

  #onData(connectionId, message) {
    this._onMessage(connectionId, message);
  }

  #start(port, targetNode = null) {
    const server = net.createServer(this.#handleConnection.bind(this));
    server.listen(port, '0.0.0.0');
    if (targetNode) this.connect(targetNode);
  }

  #errorHandler(error) {
    this.emit(EVENTS.ERROR, new WrappedError(ERRORS.SOCKET_ERROR, error));
  }
}

module.exports = Connection;
