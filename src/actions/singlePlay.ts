import { MessageSender } from 'src/websocket/MessageSender';
import { addUserToRoom } from './assUserToRoom';
import { DB } from '../db/DB';
import { registerUser } from './register';
import { createRoom } from './createRoom';
import { AddUserToRoomMessage } from 'src/types/game';

const db = DB.getInstance();

export const singlePlay = (messageSender: MessageSender) => {
  registerUser(
    {
      id: 0,
      type: 'reg',
      data: {
        name: 'Bot_123',
        password: '123456',
      },
    },
    messageSender,
  );

  const indexRoom = createRoom(messageSender);

  addUserToRoom(
    {
      id: 0,
      type: 'add_user_to_room',
      data: {
        indexRoom,
      },
    } as AddUserToRoomMessage,
    messageSender,
  );
};
