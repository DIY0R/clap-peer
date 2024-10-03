const net = require('net');
const {
  uuid,
  serialization,
  createData,
  deserialization,
} = require('./common');
const { HANDSHAKE } = require('./constants');

class Connection {
  NODE_ID = uuid();

  #neighbors = new Map();
  #connections = new Map();

  constructor(port, targetNode) {
    this.#start(port, targetNode);
  }

  connect(targetNode) {
    const socket = new net.Socket();
    socket.connect(targetNode, () => this.#handleConnection(socket));
  }

  /**@param {net.Socket} socket*/
  #handleConnection(socket) {
    console.log({ localPort: socket.localPort });
    const connectionId = uuid();
    socket.on('close', this.#deleteConnection(connectionId));
    socket.on('error', this.#errorHandler);
    socket.on('timeout', () => console.log('timeout'));
    socket.on('data', this.#onData.bind(this));
    this.#connections.set(connectionId, socket);
    this.#write(connectionId, createData(HANDSHAKE, this.NODE_ID));
  }

  #deleteConnection(connectionId) {
    return hadError => {
      this.#connections.delete(connectionId);
    };
  }

  #write(connectionId, message) {
    console.log(new Date().toISOString());
    const socket = this.#connections.get(connectionId);
    if (!socket) throw new Error(`Node does not exist ${connectionId}`);
    socket.write(serialization(message));
  }

  #onData(message) {
    console.log(this.NODE_ID, deserialization(message));
  }

  #start(port, targetNode = null) {
    const server = net.createServer(this.#handleConnection.bind(this));
    server.listen(port, '0.0.0.0');
    if (targetNode) this.connect(targetNode);
  }

  #errorHandler(err) {
    console.log(err);
  }

  close() {
    for (let [_, socket] of this.#connections) socket.destroy();
  }
}

module.exports = Connection;
