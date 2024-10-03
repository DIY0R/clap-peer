const serialization = message => JSON.stringify(message);
const deserialization = message => JSON.parse(message);
module.exports = { serialization, deserialization };
