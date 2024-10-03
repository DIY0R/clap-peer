const serdes = require('./serdes');
const uuid = require('./uuid');
const createData = require('./create-data');
module.exports = { ...serdes, ...uuid, ...createData };
