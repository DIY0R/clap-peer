const crypto = require('crypto');

const uuid = () =>
  crypto.randomUUID({ disableEntropyCache: false }).replace(/-/gi, '');

module.exports = uuid;
