const { Transform } = require('stream');
const { deserialization, SEPARATE_SYMBOL } = require('./common');

class CollectMessage extends Transform {
  #buffer = '';

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk, encoding = 'utf8', callback) {
    try {
      this.#buffer += chunk.toString(encoding);
      this.#processBuffer();
      callback();
    } catch (err) {
      callback(err);
    }
  }

  #processBuffer(boundary = -1) {
    while ((boundary = this.#findBoundary()) !== -1) {
      const message = this.#extractMessage(boundary);
      const objectMessage = deserialization(message);
      this.push(objectMessage);
    }
  }

  #findBoundary() {
    return this.#buffer.indexOf(SEPARATE_SYMBOL);
  }

  #extractMessage(boundary) {
    const message = this.#buffer.slice(0, boundary);
    this.#buffer = this.#buffer.slice(boundary + SEPARATE_SYMBOL.length);
    return message;
  }
}
module.exports = () => new CollectMessage();
