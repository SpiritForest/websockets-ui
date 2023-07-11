import { Cell, UsedCells, Message } from '../types/game';

export const getRandomIntInclusive = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getRange = (start: number, end: number) => {
  const minRange = 0;
  const maxRange = 9;
  const startRange = start < minRange ? minRange : start;
  const endRange = end > maxRange ? maxRange : end;

  const result: number[] = [];

  for (let i = startRange; i <= endRange; i++) {
    result.push(i);
  }

  return result;
};

export const getCellId = (cell: Cell): string => {
  return `${cell.position.x}${cell.position.y}`;
};

export const isCellPressed = (cell: Cell, usedCells: UsedCells) => {
  const cellId = getCellId(cell);
  const isCellAlreadyPressed = usedCells[cellId];

  return !!isCellAlreadyPressed;
};

export const getCellFromCoordinates = (x: number, y: number): Cell => {
  return {
    position: {
      x,
      y,
    },
  };
};

export const convertMessageToString = (message: Message): string => {
  return JSON.stringify({
    ...message,
    data: JSON.stringify(message.data),
  });
};
