class WrappedError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'Error';
    this.timestamp = new Date().toISOString();
    if (originalError instanceof Error) {
      this.originalError = originalError;
    }
  }
}
module.exports = WrappedError;
