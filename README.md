# Clap Peer — TCP-based P2P data transmission

[![Version](https://img.shields.io/npm/v/clap-peer.svg)](https://www.npmjs.com/package/clap-peer)
![Downloads](https://img.shields.io/npm/dt/clap-peer)
[![Socket Badge](https://socket.dev/api/badge/npm/package/clap-peer/0.1.0)](https://socket.dev/npm/package/clap-peer/overview/0.1.0)
[![license](https://badgen.net/npm/license/clap-peer)](https://www.npmjs.com/package/clap-peer)

### ClapPeer - is a library for creating a distributed network of nodes that supports message exchange between them. Nodes can exchange both plain and encrypted messages.

---

## Contents

- [Features](#features)
- [Example](#example)
- [Connecting to a Node](#connecting-to-a-node)
- [Sending Messages](#sending-messages)
- [Receiving Messages](#receiving-messages)
- [Error Handling](#error-handling)

## Features:

- Message transmission using intermediate nodes.
- TTL mechanism to prevent message loops.
- Encrypted message exchange (RSA + AES).

## Example

```js
const {
  ClapPeer,
  DM,
  CRYPTO_DM,
  ERROR,
  INVALID_CRYPTO_DM,
} = require('clap-peer');

//Node - 1
const node_1 = new ClapPeer(1001, 'A');
node_1.on(DM, msg => console.log(msg));
node_1.on(CRYPTO_DM, msg => console.log(msg));

//Node - 2
const node_2 = new ClapPeer(1002, 'B');
node_2.connect({ host: '127.0.0.1', port: 1001 });
node_2
  .send(node_1.nodeId, { hello: 'hello crypto' })
  .catch(error => console.log(error));
node_2.publish(node_1.nodeId, { hello: 'just hello' });
```

## Connecting to a Node

You can use either of two methods to connect to a node: via the `.connect` method or by passing a configuration object when creating the node. Choose the method based on how you want to structure your code. Here are the two approaches:

### 1. **Connecting using the `.connect()` method**:

```javascript
const node = new ClapPeer(1001, 'A');
node.connect({ host: '127.0.0.1', port: 1002 });
```

Here, we create a node and then call the `.connect()` method, passing the host and port parameters. This allows you to separate the node creation and connection logic.

### 2. **Connecting using a configuration object during node creation**:

```javascript
const node = new ClapPeer(1002, 'A', { host: '127.0.0.1', port: 1002 });
```

In this case, we pass the connection parameters directly when creating the `ClapPeer` object. This method is convenient if you need to connect to the node immediately upon creation.

## Sending Messages

### 1. **`send` — Sending an Encrypted Message**

The `send` method is used to send encrypted messages. Before sending, it checks if the target node's public key is available:

- If the key is available, the message is encrypted and sent immediately.
- If the key is not available, the node requests the public key from the target node, then encrypts and sends the message.

Example:

```javascript
node.send(node_2.nodeId, { text: 'Hello, secure world!' }).catch(error => {
  console.log(error);
});
```

---

### 2. **`publish` — Sending a Plain Message**

The `publish` method sends messages without encryption. It simply forwards the data to the specified node.

Example:

```javascript
node.publish(node_2.nodeId, {
  text: 'Hello, open world!',
});
```

---

### Differences Between `send` and `publish`:

| Method    | Encryption | Public Key Check | Request Public Key if Needed | Routing Through Intermediate Nodes |
| --------- | ---------- | ---------------- | ---------------------------- | ---------------------------------- |
| `send`    | ✅         | ✅               | ✅                           | ✅                                 |
| `publish` | ❌         | ❌               | ❌                           | ✅                                 |

## Receiving Messages

A node can subscribe to events to handle both plain and encrypted messages.

---

### 1. **Handling Messages from `publish` (`DM`)**

DM type messages are generated when another node calls the `publish` method. These messages are transmitted **unencrypted**.

```javascript
node.on(DM, msg => console.log(msg));
```

---

### 2. **Handling Messages from `send` (`CRYPTO_DM`)**

Messages of type `CRYPTO_DM` are generated when the `send` method is called by another node. These messages are received in **encrypted** form.

```javascript
node.on(CRYPTO_DM, msg => console.log(msg));
```

---

### Differences Between `DM` and `CRYPTO_DM`:

| Event       | Method That Generates the Message | Message Type       | Description                                |
| ----------- | --------------------------------- | ------------------ | ------------------------------------------ |
| `DM`        | `publish`                         | Plain text message | Handled as a regular, unencrypted message. |
| `CRYPTO_DM` | `send`                            | Encrypted message  | Sent and received in an encrypted form.    |

## Error Handling

You can subscribe to the `ERROR` event to handle all errors.

```js
node.on(ERROR, (messageError, originalError) => {
  console.log(messageError);
  console.error(originalError);
});
```

The `messageError.message` parameter may contain one of the following messages:

- **`TIMEOUT_ERROR_MESSAGE`**:  
  `Neighbor check timed out after ${TIMEOUT_DURATION / 1000} seconds`

- **`TIMEOUT_ERROR_REQUEST`**:  
  `RSA key retrieval timed out.`

- **`DECRYPT_ERROR`**:  
  `Unable to decrypt the message.`

- **`SEND_ERROR`**:  
  `Failed to send the data.`

- **`PUBLISH_ERROR`**:  
  `Failed to publish the data.`
