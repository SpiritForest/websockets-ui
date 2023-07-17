import { Damage, UsedCells, AttackMessage, Game } from '../types/game';
import { Ship } from '../entities/Ship';
import { DB } from '../db/DB';
import {
  isCellPressed,
  getCellId,
  getCellFromCoordinates,
} from '../utils/utils';
import { MessageSender } from '../websocket/MessageSender';
import { finish } from './finish';

const db = DB.getInstance();

const validateMessageDataForAttack = (message: AttackMessage): void => {
  const { x, y, gameId, indexPlayer } = message.data;

  if (
    typeof gameId !== 'number' ||
    typeof indexPlayer !== 'number' ||
    typeof x !== 'number' ||
    typeof y !== 'number'
  ) {
    throw new Error(
      'Not possible to attack, some required parameters are missing',
    );
  }
};

const addCellsToUsed = (killedShip: Ship, usedCells: UsedCells): void => {
  killedShip.getSurroundingCells().forEach((cell) => {
    usedCells[getCellId(cell)] = cell;
  });
};

const markSurroundingCellsAsMissed = (
  indexRoom: number,
  indexPlayer: number,
  killedShip: Ship,
  messageSender: MessageSender,
) => {
  killedShip.getSurroundingCells().forEach((cell) => {
    if (cell.damageType === Damage.Miss) {
      messageSender.broadcastToRoom(indexRoom, {
        type: 'attack',
        data: {
          position: {
            x: cell.position.x,
            y: cell.position.y,
          },
          currentPlayer: indexPlayer,
          status: Damage.Miss,
        },
        id: 0,
      });
    }
  });
};

const updateCellsForKilledShip = (
  indexRoom: number,
  indexPlayer: number,
  killedShip: Ship,
  messageSender: MessageSender,
) => {
  killedShip.shipCells.forEach((cell) => {
    messageSender.broadcastToRoom(indexRoom, {
      type: 'attack',
      data: {
        position: {
          x: cell.position.x,
          y: cell.position.y,
        },
        currentPlayer: indexPlayer,
        status: Damage.Killed,
      },
      id: 0,
    });
  });
};

const getEnemyShipDamageStatus = (message: AttackMessage) => {
  const { x, y, gameId, indexPlayer } = message.data;
  const game = db.findGameBy(gameId);
  const currentPlayerIndex = game?.players.findIndex(
    (player) => player.indexPlayer === indexPlayer,
  );
  const indexEnemy = currentPlayerIndex === 0 ? 1 : 0;
  const enemyShips = game.players[indexEnemy].ships;
  let killedShip;
  const damageType = enemyShips.reduce((damageType, ship) => {
    const damage = ship.checkDamageFromAttack(x, y);

    if (damage === Damage.Killed) {
      killedShip = ship;
    }

    return damageType !== Damage.Miss ? damageType : damage;
  }, Damage.Miss);

  const isPlayerWin = enemyShips.every((ship) => ship.isShipKilled());
  return { damageType, killedShip, isPlayerWin };
};

export const attack = (
  message: AttackMessage,
  indexRoom: number,
  messageSender: MessageSender,
): void => {
  validateMessageDataForAttack(message);
  const { x, y, gameId, indexPlayer } = message.data;
  const game = db.findGameBy(gameId);

  // if it's not current player turn don't allow to make an attack
  // if (game.currentPlayer !== messageSender.ws.userId) {
  //   return;
  // }

  if (typeof indexRoom !== 'number') {
    throw new Error('The room is not found');
  }

  const usedCells = game.players[indexPlayer].usedCells;

  // If the cell has already been pressed -> do nothing
  if (isCellPressed(getCellFromCoordinates(x, y), usedCells)) {
    return;
  } else {
    const cell = getCellFromCoordinates(x, y);
    usedCells[getCellId(cell)] = cell;
  }

  const { damageType, killedShip, isPlayerWin } =
    getEnemyShipDamageStatus(message);

  messageSender.broadcastToRoom(indexRoom, {
    type: 'attack',
    data: {
      position: {
        x,
        y,
      },
      currentPlayer: message.data.indexPlayer,
      status: damageType,
    },
    id: 0,
  });

  if (damageType !== Damage.Shot) {
    messageSender.sendTurn(indexRoom, game);
    if (killedShip && typeof message.data.indexPlayer === 'number') {
      updateCellsForKilledShip(
        indexRoom,
        message.data.indexPlayer,
        killedShip,
        messageSender,
      );
      if (isPlayerWin) {
        finish(indexRoom, indexPlayer, messageSender);
      }
      markSurroundingCellsAsMissed(
        indexRoom,
        message.data.indexPlayer,
        killedShip,
        messageSender,
      );
      addCellsToUsed(killedShip, usedCells);
    }
  } else if (damageType === Damage.Shot) {
    messageSender.sendSamePlayerTurn(indexRoom, game);
  }
};
