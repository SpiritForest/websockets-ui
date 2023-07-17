import { WebSocketServer } from 'ws';

import { Game, Message, WebSocketExtended } from '../types/game';
import { convertMessageToString } from '../utils/utils';
import { DB } from '../db/DB';

export class MessageSender {
  wss: WebSocketServer;
  ws: WebSocketExtended;
  db: DB;

  constructor(wss: WebSocketServer, ws: WebSocketExtended) {
    this.wss = wss;
    this.ws = ws;
    this.db = DB.getInstance();
  }

  sendPersonalMessageById(indexUser: number, message: Message) {
    this.wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as WebSocketExtended;
      if (ws.userId === indexUser) {
        client.send(convertMessageToString(message));
      }
    });
  }

  sendPersonalMessage(message: Message) {
    this.ws.send(convertMessageToString(message));
  }

  broadcastAToAll(message: Message) {
    this.wss.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  broadcastToRoom(indexRoom: number, message: Message) {
    this.wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as WebSocketExtended;
      if (ws.roomId === indexRoom) {
        client.send(convertMessageToString(message));
      }
    });
  }

  sendTurn(roomId: number, game: Game) {
    const currentPlayerIndex = game.players.findIndex(
      (player) => player.indexPlayer === game.currentPlayer,
    );
    // change current player turn
    const nextPlayerIndex = currentPlayerIndex === 1 ? 0 : 1;
    game.currentPlayer = game.players[nextPlayerIndex].indexPlayer;

    this.sendSamePlayerTurn(roomId, game);
  }

  sendSamePlayerTurn(roomId: number, game: Game) {
    const message = {
      type: 'turn',
      data: {
        currentPlayer: game.currentPlayer,
      },
      id: 0,
    } as Message;

    this.broadcastToRoom(roomId, message);
  }
}
