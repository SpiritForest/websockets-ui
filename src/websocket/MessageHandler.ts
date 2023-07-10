import { WebSocketServer } from 'ws';

import { DB } from '../db/DB';
import {
  IUser,
  WebSocketExtended,
  Damage,
  UsedCells,
  Cell,
  Game,
} from '../types/game';
import { Message } from '../types/game';
import { Ship } from 'src/entities/Ship';
import { getCellId, getRandomIntInclusive } from '../utils/utils';

export class MessageHandler {
  db: DB;
  ws: WebSocketExtended;
  wss: WebSocketServer;

  constructor(ws: WebSocketExtended, wss: WebSocketServer) {
    this.db = DB.getInstance();
    this.ws = ws;
    this.wss = wss;
  }

  getMessage(data: Buffer): Message {
    const defaultMessage = {
      data: {},
      id: 0,
      type: '',
    } as Message;

    const message = JSON.parse(data.toString());
    message.data = message.data ? JSON.parse(message.data) : message.data;

    return message || defaultMessage;
  }

  handleMessage(data: Buffer): void {
    const message = this.getMessage(data);
    const response = {
      type: message.type,
      data: '{}',
      id: 0,
    } as Message;

    switch (message.type) {
      case 'reg':
        const data = this.registerUser(message.data as IUser);
        response.data = data;
        response.type = message.type;
        this.ws.userId = data.index;
        this.sendPersonalMessage(response);
        this.sendUpdateRoom();
        break;
      case 'create_room':
        this.createRoom();
        break;
      case 'add_user_to_room':
        const indexRoom = message.data.indexRoom;

        if (typeof indexRoom === 'number') {
          this.addUserToRoom(indexRoom);
          this.ws.roomId = indexRoom;
        }
        break;
      case 'add_ships':
        this.addShips(message);
        break;
      case 'attack':
        this.attack(message);
        break;
      case 'randomAttack':
        this.randomAttack(message);
        break;
      default:
        console.log('Command not found');
    }
  }

  randomAttack(message: Message) {
    const minRange = 0;
    const maxRange = 9;
    let x = 0;
    let y = 0;

    if (
      typeof message.data.gameId !== 'number' ||
      typeof message.data.indexPlayer !== 'number'
    ) {
      throw new Error(
        'Not possible to attack randomly, some required parameters are missing',
      );
    }

    const game = this.db.findGameBy(message.data.gameId);

    if (!game) {
      throw new Error('The game is not found');
    }

    const indexPlayer = message.data.indexPlayer;
    const usedCells = game.players[indexPlayer].usedCells;

    let isTryToFindFreeCell = true;

    while (isTryToFindFreeCell) {
      const totalNumberOfCells = 100;
      x = getRandomIntInclusive(minRange, maxRange);
      y = getRandomIntInclusive(minRange, maxRange);

      if (Object.keys(usedCells).length === totalNumberOfCells) {
        isTryToFindFreeCell = false;
      }
      if (!this.isCellPressed(this.getCellFromCoordinates(x, y), usedCells)) {
        isTryToFindFreeCell = false;
      }
    }

    this.attack({
      ...message,
      data: {
        ...message.data,
        x,
        y,
      },
    });
  }

  attack(message: Message) {
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

    const game = this.db.findGameBy(gameId);
    const currentPlayerIndex = game?.players.findIndex(
      (player) => player.indexPlayer === indexPlayer,
    );
    const indexEnemy = currentPlayerIndex === 0 ? 1 : 0;

    if (!game || !game.players.length) {
      throw new Error('The game is not found');
    }

    if (typeof this.ws.roomId !== 'number') {
      throw new Error('The room is not found');
    }

    const usedCells = game.players[indexPlayer].usedCells;

    // If the cell has already been pressed -> do nothing
    if (this.isCellPressed(this.getCellFromCoordinates(x, y), usedCells)) {
      return;
    } else {
      const cell = this.getCellFromCoordinates(x, y);
      usedCells[getCellId(cell)] = cell;
    }

    const enemyShips = game.players[indexEnemy].ships;
    let killedShip;
    const damageType = enemyShips.reduce((damageType, ship) => {
      const damage = ship.checkDamageFromAttack(x, y);

      if (damage === Damage.Killed) {
        killedShip = ship;
      }

      return damageType !== Damage.Miss ? damageType : damage;
    }, Damage.Miss);

    this.broadcastToRoom(this.ws.roomId, {
      type: 'attack',
      data: {
        position: {
          x: x,
          y: y,
        },
        currentPlayer: message.data.indexPlayer,
        status: damageType,
      },
      id: 0,
    });

    if (damageType !== Damage.Shot) {
      this.sendTurn(gameId);
      if (killedShip && typeof message.data.indexPlayer === 'number') {
        this.updateCellsForKilledShip(message.data.indexPlayer, killedShip);
        this.markSurroundingCellsAsMissed(message.data.indexPlayer, killedShip);
        this.addCellsToUsed(killedShip, usedCells);
      }
    }
  }

  getCellFromCoordinates(x: number, y: number): Cell {
    return {
      position: {
        x,
        y,
      },
    };
  }

  isCellPressed(cell: Cell, usedCells: UsedCells) {
    const cellId = getCellId(cell);
    const isCellAlreadyPressed = usedCells[cellId];

    return !!isCellAlreadyPressed;
  }

  updateCellsForKilledShip(indexPlayer: number, killedShip: Ship) {
    if (typeof this.ws.roomId !== 'number') {
      throw new Error('The room is not found');
    }

    const roomId = this.ws.roomId;

    killedShip.shipCells.forEach((cell) => {
      this.broadcastToRoom(roomId, {
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
  }

  markSurroundingCellsAsMissed(indexPlayer: number, killedShip: Ship) {
    if (typeof this.ws.roomId !== 'number') {
      throw new Error('The room is not found');
    }

    const roomId = this.ws.roomId;

    killedShip.getSurroundingCells().forEach((cell) => {
      if (cell.damageType === Damage.Miss) {
        this.broadcastToRoom(roomId, {
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
  }

  addCellsToUsed(killedShip: Ship, usedCells: UsedCells): void {
    killedShip.getSurroundingCells().forEach((cell) => {
      usedCells[getCellId(cell)] = cell;
    });
  }

  addShips(message: Message) {
    if (message.data.ships && typeof message.data.gameId === 'number') {
      const isGameReadyToStart = this.db.addShipsToPlayer(
        message.data.gameId,
        this.ws.userId,
        message.data.ships,
      );

      if (isGameReadyToStart) {
        this.startGame(message.data.gameId);
      }
    } else {
      throw new Error('Not enough parameters to add ships to the player');
    }
  }

  startGame(gameId: number) {
    const game = this.db.findGameBy(gameId);

    if (!game) {
      throw new Error('The game is not found');
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

      if (
        typeof this.ws.roomId === 'number' &&
        typeof game.currentPlayer === 'number'
      ) {
        this.sendPersonalMessageById(player.indexPlayer, message);
      }
    });
    this.sendTurn(gameId);
  }

  sendTurn(gameId: number) {
    if (typeof this.ws.roomId === 'number' && typeof gameId === 'number') {
      const game = this.db.findGameBy(gameId);

      if (game) {
        const message = {
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer,
          },
          id: 0,
        } as Message;

        this.broadcastToRoom(this.ws.roomId, message);

        game.currentPlayer = game.currentPlayer === 1 ? 0 : 1;
      }
    }
  }

  registerUser(user: IUser) {
    return this.db.addUser(user);
  }

  createRoom() {
    const indexRoom = this.db.createRoom();
    this.addUserToRoom(indexRoom);
  }

  addUserToRoom(indexRoom: number) {
    this.db.addUserToRoom(this.ws.userId, indexRoom);
    this.ws.roomId = indexRoom;

    if (this.db.isRoomFull(indexRoom)) {
      this.createGame(indexRoom);
    }

    this.sendUpdateRoom();
  }

  createGame(indexRoom: number) {
    const gameId = this.db.createGame();

    // this.sendPersonalMessageById();
    this.wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as WebSocketExtended;
      if (ws.roomId === indexRoom) {
        ws.gameId = gameId;
        const message = {
          type: 'create_game',
          data: {
            idGame: gameId,
            idPlayer: ws.userId,
          },
          id: 0,
        } as Message;
        client.send(this.convertMessageToString(message));
      }
    });
  }

  sendUpdateRoom() {
    const roomsWithOneUser = this.db.rooms.filter((room) => {
      return room.roomUsers.length === 1;
    });

    if (roomsWithOneUser.length) {
      const message = {
        type: 'update_room',
        data: JSON.stringify(roomsWithOneUser),
        id: 0,
      } as Message;

      this.broadcastAToAll(message);
    }
  }

  convertMessageToString(message: Message): string {
    return JSON.stringify({
      ...message,
      data: JSON.stringify(message.data),
    });
  }

  sendPersonalMessageById(indexUser: number, message: Message) {
    this.wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as WebSocketExtended;
      if (ws.userId === indexUser) {
        client.send(this.convertMessageToString(message));
      }
    });
  }

  sendPersonalMessage(message: Message) {
    this.ws.send(this.convertMessageToString(message));
  }

  broadcastAToAll(message: Message) {
    this.wss.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  broadcastToRoom(indexRoom: number, message: Message) {
    this.wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as WebSocketExtended;
      if (ws.roomId === indexRoom) {
        client.send(this.convertMessageToString(message));
      }
    });
  }
}
