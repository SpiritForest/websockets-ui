import { WebSocketServer } from 'ws';

import { DB } from '../db/DB';
import {
  AddShipsMessage,
  AddUserToRoomMessage,
  AttackMessage,
  RandomAttackMessage,
  RegistrationMessage,
  WebSocketExtended,
} from '../types/game';
import { Message } from '../types/game';
import { attack } from '../actions/attack';
import { randomAttack } from '../actions/randomAttack';
import { MessageSender } from './MessageSender';
import { addShips } from '../actions/addShips';
import { registerUser } from '../actions/register';
import { addUserToRoom } from '../actions/assUserToRoom';
import { createRoom } from '../actions/createRoom';

export class MessageHandler {
  db: DB;
  ws: WebSocketExtended;
  wss: WebSocketServer;
  messageSender: MessageSender;

  constructor(ws: WebSocketExtended, wss: WebSocketServer) {
    this.messageSender = new MessageSender(wss, ws);
    this.db = DB.getInstance();
    this.ws = ws;
    this.wss = wss;
  }

  getMessage(data: Buffer): Message {
    const defaultMessage = {
      data: {},
      id: 0,
      type: '',
    } as Message;

    const message = JSON.parse(data.toString());
    message.data = message.data ? JSON.parse(message.data) : message.data;

    return message || defaultMessage;
  }

  handleMessage(data: Buffer): void {
    const message = this.getMessage(data);

    switch (message.type) {
      case 'reg':
        registerUser(message as RegistrationMessage, this.messageSender);
        break;
      case 'create_room':
        createRoom(this.messageSender);
        break;
      case 'add_user_to_room':
        addUserToRoom(message as AddUserToRoomMessage, this.messageSender);
        break;
      case 'add_ships':
        addShips(
          message as AddShipsMessage,
          this.ws.roomId as number,
          this.messageSender,
        );
        break;
      case 'attack':
        attack(
          message as AttackMessage,
          this.ws.roomId as number,
          this.messageSender,
        );
        break;
      case 'randomAttack':
        randomAttack(
          message as RandomAttackMessage,
          this.ws.roomId as number,
          this.messageSender,
        );
        break;
      default:
        console.log('Command not found');
    }
  }
}
