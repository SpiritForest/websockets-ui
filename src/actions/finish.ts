import { MessageSender } from '../websocket/MessageSender';
import { sendUpdateRoom } from './updateRoom';
import { updateWinners } from './updateWinners';
import { DB } from '../db/DB';

const db = DB.getInstance();

export const finish = (
  indexRoom: number,
  indexPlayer: number,
  messageSender: MessageSender,
) => {
  messageSender.broadcastToRoom(indexRoom, {
    type: 'finish',
    data: {
      winPlayer: indexPlayer,
    },
    id: 0,
  });

  db.closeRoom(indexRoom);
  sendUpdateRoom(messageSender);
  updateWinners(indexRoom, indexPlayer, messageSender);
};
