import { MessageSender } from '../websocket/MessageSender';
import { DB } from '../db/DB';
import { sendUpdateRoom } from './updateRoom';
import { createGame } from './createGame';
import { AddUserToRoomMessage } from '../types/game';

const db = DB.getInstance();

export const addUserToRoom = (
  message: AddUserToRoomMessage,
  messageSender: MessageSender,
) => {
  const indexRoom = message.data.indexRoom;

  db.addUserToRoom(messageSender.ws.userId, indexRoom);
  messageSender.ws.roomId = indexRoom;

  if (db.isRoomFull(indexRoom)) {
    createGame(indexRoom, messageSender.wss);
  }

  sendUpdateRoom(messageSender);
};
