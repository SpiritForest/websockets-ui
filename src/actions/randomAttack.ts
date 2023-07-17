import { Game, RandomAttackMessage } from '../types/game';
import {
  getRandomIntInclusive,
  isCellPressed,
  getCellFromCoordinates,
} from '../utils/utils';
import { DB } from '../db/DB';
import { attack } from './attack';
import { MessageSender } from 'src/websocket/MessageSender';

const db = DB.getInstance();

const validateMessageDataForAttack = (message: RandomAttackMessage): void => {
  if (
    typeof message.data.gameId !== 'number' ||
    typeof message.data.indexPlayer !== 'number'
  ) {
    throw new Error(
      'Not possible to attack randomly, some required parameters are missing',
    );
  }
};

const getRandomNotUsedCell = (
  game: Game,
  indexPlayer: number,
): {
  x: number;
  y: number;
} => {
  const minRange = 0;
  const maxRange = 9;
  let x = 0;
  let y = 0;
  const usedCells = game.players[indexPlayer as number].usedCells;

  let isTryToFindFreeCell = true;

  while (isTryToFindFreeCell) {
    const totalNumberOfCells = 100;
    x = getRandomIntInclusive(minRange, maxRange);
    y = getRandomIntInclusive(minRange, maxRange);

    if (Object.keys(usedCells).length === totalNumberOfCells) {
      isTryToFindFreeCell = false;
    }
    if (!isCellPressed(getCellFromCoordinates(x, y), usedCells)) {
      isTryToFindFreeCell = false;
    }
  }

  return {
    x,
    y,
  };
};

export const randomAttack = (
  message: RandomAttackMessage,
  indexRoom: number,
  messageSender: MessageSender,
) => {
  validateMessageDataForAttack(message);

  const game = db.findGameBy(message.data.gameId);
  const { x, y } = getRandomNotUsedCell(
    game,
    message.data.indexPlayer as number,
  );

  const attackResponseMessage = {
    ...message,
    data: {
      ...message.data,
      x,
      y,
    },
  };
  attack(attackResponseMessage, indexRoom, messageSender);
};
