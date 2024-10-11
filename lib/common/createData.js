const createData = (type, data) => ({ type, data });
const createMessage = (type, to, data) => ({ ...createData(type, data), to });
module.exports = { createData, createMessage };
