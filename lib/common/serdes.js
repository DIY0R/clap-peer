const SEPARATE_SYMBOL = '\n';
const serialization = message => JSON.stringify(message) + SEPARATE_SYMBOL;
const deserialization = message => JSON.parse(message);
module.exports = { serialization, deserialization, SEPARATE_SYMBOL };
