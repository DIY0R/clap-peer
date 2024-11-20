/* eslint-disable max-params */
const createData = (typeMessage, message) => ({ typeMessage, message });
const createMessage = (
  typeMessage,
  targetNode,
  fromNode,
  messageId,
  ttl,
  message = {},
) => ({
  targetNode,
  fromNode,
  messageId,
  typeMessage,
  message,
  ttl,
});
const createResponse = (nodeId, publicKey) => ({ nodeId, publicKey });
const createRequest = nodeId => ({ nodeId });
module.exports = {
  createData,
  createMessage,
  createRequest,
  createResponse,
};
