import { Message, WebSocketExtended } from '../types/game';
import { DB } from '../db/DB';
import { convertMessageToString } from '../utils/utils';
import { WebSocketServer } from 'ws';

const db = DB.getInstance();

export const createGame = (indexRoom: number, wss: WebSocketServer) => {
  const gameId = db.createGame();

  wss.clients.forEach((client) => {
    const ws = Object.assign({}, client) as WebSocketExtended;
    if (ws.roomId === indexRoom) {
      ws.gameId = gameId;
      const message = {
        type: 'create_game',
        data: {
          idGame: gameId,
          idPlayer: ws.userId,
        },
        id: 0,
      } as Message;
      client.send(convertMessageToString(message));
    }
  });
};
