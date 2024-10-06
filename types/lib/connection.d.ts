export = Connection;
declare class Connection {
    constructor(port: any, targetNode: any);
    connect(targetNode: any): void;
    _send(connectionId: any, message: any): void;
    close(): void;
    #private;
}
//# sourceMappingURL=connection.d.ts.map