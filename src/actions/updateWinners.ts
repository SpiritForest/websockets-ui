import { MessageSender } from '../websocket/MessageSender';
import { DB } from '../db/DB';
import { Message } from '../types/game';

const db = DB.getInstance();

export const updateWinners = (
  indexRoom: number,
  indexPlayer: number,
  messageSender: MessageSender,
) => {
  const winners = db.updateWinner(indexPlayer) || [];
  const message = {
    type: 'update_winners',
    data: winners.map((winner) => ({
      name: winner.name,
      wins: winner.wins,
    })),
    id: 0,
  } as Message;

  messageSender.broadcastToRoom(indexRoom, message);
};
