const net = require('net');
const { uuid, serialization } = require('./common');
const collectMessage = require('./chunkProcessor');

class Connection {
  _onConnect = null;
  _onData = null;

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
    const connectionId = uuid();
    socket.setNoDelay(true);
    socket.on('close', this.#deleteConnection(connectionId));
    socket.on('end', () => console.log('end'));
    socket.on('timeout', () => console.log('timeout'));
    socket.on('error', this.#errorHandler);
    socket
      .pipe(collectMessage())
      .on('data', message => this.#onData(connectionId, message));
    this.#connections.set(connectionId, socket);
    this._onConnect?.(connectionId);
  }

  #deleteConnection(connectionId) {
    return error => {
      this.#connections.delete(connectionId);
    };
  }

  _send(connectionId, message) {
    const socket = this.#connections.get(connectionId);
    if (!socket) throw new Error(`Node does not exist ${connectionId}`);
    socket.write(serialization(message));
  }

  #onData(connectionId, message) {
    this._onData?.(connectionId, message);
  }

  #start(port, targetNode = null) {
    const server = net.createServer(this.#handleConnection.bind(this));
    server.listen(port, '0.0.0.0');
    if (targetNode) this.connect(targetNode);
  }

  close() {
    for (let [connectionId, socket] of this.#connections) {
      socket.close();
      this.#deleteConnection(connectionId);
    }
  }

  #errorHandler(err) {
    console.log(err);
  }
}

module.exports = Connection;
