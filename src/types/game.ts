import WebSocket from 'ws';

export interface AttackMessage {
  id: number;
  type: MessageType;
  data: {
    x: number;
    y: number;
    gameId: number;
    indexPlayer: number;
  };
}
export interface RandomAttackMessage {
  id: number;
  type: MessageType;
  data: {
    gameId: number;
    indexPlayer: number;
  };
}

export interface AddShipsMessage {
  id: number;
  type: MessageType;
  data: {
    gameId: number;
    ships: IShip[];
    indexPlayer: number;
  };
}

export interface RegistrationMessage {
  id: 0;
  type: MessageType;
  data: {
    name: string;
    password: string;
  };
}

export interface AddUserToRoomMessage {
  id: number;
  type: MessageType;
  data: {
    indexRoom: number;
  };
}

export interface IUser {
  name: string;
  password: string;
  index?: number;
}

export interface WebSocketExtended extends WebSocket {
  userId: number;
  roomId: number | undefined;
  gameId: number | undefined;
}

export type MessageType =
  | 'reg'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'create_game'
  | 'update_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'turn'
  | 'finish'
  | 'randomAttack'
  | '';

export interface Message {
  type: MessageType;
  data: MessageData;
  id: number;
}

export interface ResponseMessage {
  type: MessageType;
  data: string;
  id: number;
}

export interface Winners {
  [key: string]: {
    indexPlayer: number;
    name: string;
    wins: number;
  };
}

export interface Room {
  roomId: number;
  roomUsers: RoomUser[];
}

export interface UsedCells {
  [key: string]: { position: Position };
}

export interface GamePlayerData {
  indexPlayer: number;
  usedCells: UsedCells;
  ships: IShip[];
}

export interface Game {
  idGame: number;
  currentPlayer?: number;
  players: GamePlayerData[];
}

export interface MessageData {
  name?: string;
  password?: string;
  index?: number;
  error?: boolean;
  errorText?: string;
  idGame?: number;
  idPlayer?: number;
  indexRoom?: number;
  roomId?: number;
  roomUsers?: RoomUser[];
  ships?: IShip[];
  indexPlayer?: number;
  gameId?: number;
  x?: number;
  y?: number;
  currentPlayerIndex?: number;
  position?: Position;
  currentPlayer?: number;
  status?: Damage;
  winPlayer?: number;
}

export interface RoomUser {
  name: string;
  index: number;
}

export interface Position {
  x: number;
  y: number;
}

export type Cell = {
  position: Position;
  damaged?: boolean;
  damageType?: string;
};

export interface IShip {
  position: Position;
  direction: boolean;
  length: number;
  type?: 'small' | 'medium' | 'large' | 'huge';
  checkDamageFromAttack: (x: number, y: number) => Damage;
  isShipKilled: () => boolean;
}

export enum Damage {
  Miss = 'miss',
  Killed = 'killed',
  Shot = 'shot',
}
