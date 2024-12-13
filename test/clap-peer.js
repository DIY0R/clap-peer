const assert = require('assert');
const { describe, test, after } = require('node:test');
const { ClapPeer, EVENTS } = require('..');

describe('Clap-Peer', () => {
  test('two neighbors', async () => {
    const message = { hello: 'hello' };
    const node_1 = await ClapPeer(0, 'A');
    const node_2 = await ClapPeer(0, 'B');
    await node_2.connect({ host: '127.0.0.1', port: node_1.port });
    node_2.publish(node_1.nodeId, message);
    const messageDm = await new Promise(res => {
      node_1.on(EVENTS.DM, res);
    });
    assert.deepEqual(messageDm.message, message);
  });

  after(() => {
    process.exit();
  });
});
