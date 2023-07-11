import { Message } from '../types/game';
import { DB } from '../db/DB';
import { MessageSender } from '../websocket/MessageSender';

const db = DB.getInstance();

export const sendUpdateRoom = (messageSender: MessageSender) => {
  const roomsWithOneUser = db.rooms.filter((room) => {
    return room.roomUsers.length === 1;
  });

  const message = {
    type: 'update_room',
    data: JSON.stringify(roomsWithOneUser),
    id: 0,
  } as Message;

  messageSender.broadcastAToAll(message);
};
