import { RegistrationMessage, Message } from '../types/game';
import { DB } from '../db/DB';
import { MessageSender } from '../websocket/MessageSender';
import { sendUpdateRoom } from './updateRoom';

const db = DB.getInstance();

export const registerUser = (
  message: RegistrationMessage,
  messageSender: MessageSender,
) => {
  let error = false;
  let errorText = '';

  if (message.data.name.length < 5) {
    error = true;
    errorText = 'The user name must contain at least 5 symbols';
  }

  if ((message as RegistrationMessage).data.password.length < 5) {
    error = true;
    errorText = 'The password must contain at least 5 symbols';
  }

  const userData = db.addUser(message.data);
  const registrationResponseMessage = {
    id: 0,
    type: 'reg',
    data: {
      name: userData.name,
      index: userData.index,
      error,
      errorText,
    },
  } as Message;
  messageSender.ws.userId = userData.index;
  messageSender.sendPersonalMessage(registrationResponseMessage);
  sendUpdateRoom(messageSender);
};
