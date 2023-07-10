import { IUser, Room, Game, IShip } from '../types/game';
import { Ship } from '../entities/Ship';

export class DB {
  static instance: DB | undefined;
  users: IUser[];
  rooms: Room[];
  games: Game[];

  constructor() {
    this.users = [];
    this.rooms = [];
    this.games = [];
  }

  static getInstance() {
    if (!DB.instance) {
      DB.instance = new DB();
    }

    return DB.instance;
  }

  addUser(user: IUser) {
    const index =
      this.users.push({
        ...user,
        index: this.users.length,
      }) - 1;

    return {
      name: user.name,
      index,
      error: false,
      errorText: '',
    };
  }

  addShipsToPlayer(gameId: number, indexPlayer: number, ships: IShip[]) {
    const game = this.games[gameId];
    let isPlayersAddedShips = false;
    const maxNumbersOfShips = 10;

    if (!game) {
      throw new Error("The game doesn't exist");
    }

    const player = game.players.find(
      (player) => player.indexPlayer === indexPlayer,
    );

    if (!player) {
      game.players.push({
        indexPlayer: indexPlayer,
        usedCells: {},
        ships: ships.map(
          (ship) => new Ship(ship.position, ship.length, ship.direction),
        ),
      });
    } else {
      player.ships = player.ships.concat(ships);
    }

    isPlayersAddedShips =
      (game.players.length === 2 &&
        game.players.every(
          (player) => player.ships.length === maxNumbersOfShips,
        )) ??
      false;

    if (isPlayersAddedShips) {
      game.currentPlayer = 0;
    }

    return isPlayersAddedShips;
  }

  findGameBy(id: number | undefined): Game | undefined {
    return this.games.find((game) => game.idGame === id);
  }

  createGame() {
    return (
      this.games.push({
        idGame: this.games.length,
        players: [],
      }) - 1
    );
  }

  isRoomFull(indexRoom: number) {
    return this.getRoomBy(indexRoom).roomUsers.length === 2;
  }

  getRoomBy(indexRoom: number) {
    return this.rooms[indexRoom];
  }

  createRoom() {
    return (
      this.rooms.push({
        roomId: this.rooms.length,
        roomUsers: [],
      }) - 1
    );
  }

  addUserToRoom(indexUser: number, indexRoom: number): Room | undefined {
    const room = this.rooms.find((room) => room.roomId === indexRoom);
    const user = this.users.find((user) => user.index === indexUser);

    if (room && user) {
      room.roomUsers.push({
        name: user.name,
        index: user.index || 0,
      });
      return room;
    }
  }
}
