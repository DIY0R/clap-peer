export = Messaging;
declare class Messaging extends Connection {
    NODE_ID: string;
    neighbors: Map<any, any>;
    _newConnection(connectionId: any): void;
    _onMessage(connectionId: any, messageObject: any): void;
    #private;
}
import Connection = require("./connection");
//# sourceMappingURL=messaging.d.ts.map