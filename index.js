const Messaging = require('./lib/messaging');
const constants = require('./lib/constants');

module.exports = {
  ClapPeer: (...params) => new Messaging(...params),
  ...constants,
};
