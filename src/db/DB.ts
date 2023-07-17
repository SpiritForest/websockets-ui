import { IUser, Room, Game, IShip, Winners } from '../types/game';
import { Ship } from '../entities/Ship';

export class DB {
  static instance: DB | undefined;
  users: IUser[];
  rooms: Room[];
  games: Game[];
  winners: Winners;

  constructor() {
    this.users = [];
    this.rooms = [];
    this.games = [];
    this.winners = {};
  }

  static getInstance() {
    if (!DB.instance) {
      DB.instance = new DB();
    }

    return DB.instance;
  }

  closeRoom(indexRooom: number) {
    this.rooms = this.rooms.filter((room) => room.roomId !== indexRooom);
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

  findGameBy(id: number): Game {
    return this.games[id];
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

  addUserToRoom(indexPlayer: number, indexRoom: number): Room | undefined {
    const room = this.rooms.find((room) => room.roomId === indexRoom);
    const user = this.users.find((user) => user.index === indexPlayer);

    if (room && user) {
      room.roomUsers.push({
        name: user.name,
        index: user.index || 0,
      });
      return room;
    }
  }

  updateWinner(indexPlayer: number) {
    const user = this.users.find((user) => user.index === indexPlayer);

    if (user) {
      const isUserWonInThePast = !!this.winners[user.name];
      if (isUserWonInThePast) {
        this.winners[user.name].wins += 1;
      } else {
        this.winners[user.name] = {
          indexPlayer,
          name: user.name,
          wins: 1,
        };
      }

      return Object.values(this.winners).sort((a, b) => b.wins - a.wins);
    }
  }
}
