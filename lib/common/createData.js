const createData = (type, data) => ({ type, data });
const createMessage = ({ type, to, message, messageId, ttl }) => ({
  messageId,
  ...createData(type, message),
  to,
  ttl,
});
module.exports = { createData, createMessage };
