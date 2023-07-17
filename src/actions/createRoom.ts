import { MessageSender } from '../websocket/MessageSender';
import { DB } from '../db/DB';
import { addUserToRoom } from './assUserToRoom';
import { AddUserToRoomMessage } from '../types/game';

const db = DB.getInstance();

export const createRoom = (messageSender: MessageSender): number => {
  const indexRoom = db.createRoom();
  const addUserToRoomMessage = {
    id: 0,
    type: 'add_user_to_room',
    data: {
      indexRoom,
    },
  } as AddUserToRoomMessage;
  addUserToRoom(addUserToRoomMessage, messageSender);

  return indexRoom;
};
