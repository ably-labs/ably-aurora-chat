> [!IMPORTANT]
> This repository uses the Ably Pub/Sub approach for building chat apps. We now offer Ably Chat—a new family of SDKs and APIs that streamline development and manage realtime chat complexity for you. For a modern, easier way to create chat experiences, visit our [Ably Chat documentation](https://ably.com/docs/chat).

# Chat Demo with Ably and AWS Aurora

This demo makes use of Ably for realtime communication between devices and a server, and a MySQL backend such as Aurora for persisting data. The server instance run is an Express server, which also acts as a filter for certain banned words. 

This demo makes use of the [Ably Chat WebComponent](https://github.com/ably-labs/ably-chat-component) to render the chat interface to the clients.

## Running this demo

To run this demo, you can run:

```sh
npm run start
```
