const TTL = 300;

const CHECK_INTERVAL = 500;
const TIMEOUT_DURATION = 2 * 60000;
const TIME_CLEAN_MSG = 30 * 60000;
const DEFAULT_TIMEOUT = 10000;
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

const ERROR = 'ERROR';
const HANDSHAKE = 'HANDSHAKE';
const DM = 'MESSAGE';
const CRYPTO_DM = 'CRYPTO_DM';
const PUBLIC_KEY_REQUEST = 'PUBLIC_KEY_REQUEST';
const PUBLIC_KEY_RESPONSE = 'PUBLIC_KEY_RESPONSE';

const TIMEOUT_ERROR_MESSAGE = `Neighbor check timed out after ${TIMEOUT_DURATION / 1000} seconds`;
const TIMEOUT_ERROR_REQUEST = 'RSA key retrieval timed out.';
const DECRYPT_ERROR = 'Unable to decrypt the message.';
const SEND_ERROR = 'Failed to send the data.';
const PUBLISH_ERROR = 'Failed to publish the data.';
const SOCKET_ERROR = 'An error occurred with the socket connection.';

const CONSTANTS = {
  TIMEOUTS: {
    CHECK_INTERVAL,
    TIMEOUT_DURATION,
    TIME_CLEAN_MSG,
    DEFAULT_TIMEOUT,
    TWO_DAYS,
  },
  EVENTS: { DM, CRYPTO_DM, ERROR },
  MESSAGES: {
    HANDSHAKE,
    PUBLIC_KEY_REQUEST,
    PUBLIC_KEY_RESPONSE,
  },
  ERRORS: {
    TIMEOUT_ERROR_MESSAGE,
    TIMEOUT_ERROR_REQUEST,
    DECRYPT_ERROR,
    SEND_ERROR,
    PUBLISH_ERROR,
    SOCKET_ERROR,
  },
  TTL,
};

module.exports = CONSTANTS;
