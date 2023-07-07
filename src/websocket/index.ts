import WebSocket, { WebSocketServer } from 'ws';

export const runWebSocket = (port = 3000) => {
    const wss = new WebSocketServer({ port });

    return new Promise((res, rej) => {
        wss.on('connection', (ws: WebSocket) => {
            ws.on('error', console.error);
    
            ws.on('message', (data: string) => {
                console.log('received: %s', data);
            });
    
            //   ws.send('something');
            res(port);
        });
        wss.on('error', rej);
    });
}
