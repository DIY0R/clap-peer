const HANDSHAKE = 'HANDSHAKE';
const DM = 'MES SAGE';
const CHECK_INTERVAL = 500;
const TIMEOUT_DURATION = 20000;

const TIMEOUT_ERROR_MESSAGE = `Neighbor check timed out after ${TIMEOUT_DURATION / 1000} seconds`;

module.exports = {
  HANDSHAKE,
  DM,
  CHECK_INTERVAL,
  TIMEOUT_DURATION,
  TIMEOUT_ERROR_MESSAGE,
};
