import { WebSocketServer } from 'ws';

import { MessageHandler } from './MessageHandler';
import { WebSocketExtended } from '../types/game';

export const runWebSocket = (port = 3000) => {
  const wss = new WebSocketServer({ port });

  return new Promise((res, rej) => {
    wss.on('connection', (ws: WebSocketExtended) => {
      const messageHandler = new MessageHandler(ws, wss);
      ws.on('error', console.error);

      ws.on('message', (data: Buffer) => {
        console.log('received: %s', data);
        messageHandler.handleMessage(data);
      });

      res(port);
    });
    wss.on('error', rej);
  });
};
