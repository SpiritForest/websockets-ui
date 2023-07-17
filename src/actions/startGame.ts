import { Message } from '../types/game';
import { MessageSender } from '../websocket/MessageSender';
import { DB } from '../db/DB';

const db = DB.getInstance();

export const startGame = (
  indexRoom: number,
  gameId: number,
  messageSender: MessageSender,
) => {
  const game = db.findGameBy(gameId);

  if (typeof game.currentPlayer !== 'number') {
    throw new Error('Current player is not found');
  }

  game.players.forEach((player) => {
    const message = {
      type: 'start_game',
      data: {
        ships: player.ships,
        currentPlayerIndex: player.indexPlayer,
      },
      id: 0,
    } as Message;

    messageSender.sendPersonalMessageById(player.indexPlayer, message);
  });
  messageSender.sendTurn(indexRoom, game);
};
