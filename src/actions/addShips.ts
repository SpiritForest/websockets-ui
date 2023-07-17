import { AddShipsMessage } from '../types/game';
import { MessageSender } from '../websocket/MessageSender';
import { DB } from '../db/DB';
import { startGame } from './startGame';

const db = DB.getInstance();

export const addShips = (
  message: AddShipsMessage,
  indexRoom: number,
  messageSender: MessageSender,
) => {
  const isGameReadyToStart = db.addShipsToPlayer(
    message.data.gameId,
    message.data.indexPlayer,
    message.data.ships,
  );

  if (isGameReadyToStart) {
    startGame(indexRoom, message.data.gameId, messageSender);
  }
};
