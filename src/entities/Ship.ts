import { IShip, Position, Damage, Cell } from '../types/game';
import { getRange, getCellId } from '../utils/utils';

export class Ship implements IShip {
  position: Position;
  length: number;
  direction: boolean;
  shipCells: Cell[];

  constructor(position: Position, length: number, direction: boolean) {
    this.position = position;
    this.length = length;
    this.direction = direction;
    this.shipCells = this.getShipsCells();
  }

  getShipsCells(): Cell[] {
    const shipCells = [];

    for (let i = 0; i < this.length; i++) {
      let x;
      let y;

      if (this.isShipPlacedHorizontally()) {
        x = this.position.x + i;
        y = this.position.y;
      } else {
        x = this.position.x;
        y = this.position.y + i;
      }

      shipCells.push({
        position: {
          x,
          y,
        },
        damaged: false,
      });
    }

    return shipCells;
  }

  isShipPlacedHorizontally() {
    return !this.direction;
  }

  checkDamageFromAttack(x: number, y: number): Damage {
    const isDamaged = this.isCellDamaged(x, y);
    let damageType = Damage.Miss;

    if (isDamaged && this.isShipKilled()) {
      damageType = Damage.Killed;
    } else if (isDamaged) {
      damageType = Damage.Shot;
    }

    return damageType;
  }

  isCellDamaged(x: number, y: number) {
    return this.shipCells.some((cell) => {
      const isCellDamaged = cell.position.x === x && cell.position.y === y;

      if (isCellDamaged) {
        cell.damaged = true;
      }

      return isCellDamaged;
    });
  }

  isShipKilled() {
    const isShipKilled = this.shipCells.every((cell) => cell.damaged);

    if (isShipKilled) {
      this.markCellsAsKilled();
    }

    return isShipKilled;
  }

  markCellsAsKilled() {
    this.shipCells.forEach((cell) => {
      cell.damageType = Damage.Killed;
    });
  }

  getSurroundingCells(): Cell[] {
    const horizontalRange = getRange(
      this.position.x - 1,
      this.direction ? this.position.x + 1 : this.position.x + this.length,
    );
    const verticalRange = getRange(
      this.position.y - 1,
      this.direction ? this.position.y + this.length : this.position.y + 1,
    );
    const topCells = this.getTopCells(horizontalRange, verticalRange);
    const bottomCells = this.getBottomCells(horizontalRange, verticalRange);
    const leftCells = this.getLeftCells(verticalRange, horizontalRange);
    const rightCells = this.getRightCells(verticalRange, horizontalRange);

    // Get unique cells
    const surroundingCells = this.getMappedCells([
      ...topCells,
      ...bottomCells,
      ...leftCells,
      ...rightCells,
    ]);

    const killedCells = this.getMappedCells(this.shipCells);
    const surroundingMissingCells = Object.assign(
      {},
      surroundingCells,
      killedCells,
    );

    return Object.values(surroundingMissingCells);
  }

  private getRightCells(verticalRange: number[], horizontalRange: number[]) {
    return verticalRange.map((i) => {
      return {
        position: {
          x: horizontalRange[horizontalRange.length - 1],
          y: i,
        },
        damageType: Damage.Miss,
      };
    });
  }

  private getLeftCells(verticalRange: number[], horizontalRange: number[]) {
    return verticalRange.map((i) => {
      return {
        position: {
          x: horizontalRange[0],
          y: i,
        },
        damageType: Damage.Miss,
      };
    });
  }

  private getBottomCells(horizontalRange: number[], verticalRange: number[]) {
    return horizontalRange.map((i) => {
      return {
        position: {
          x: i,
          y: verticalRange[verticalRange.length - 1],
        },
        damageType: Damage.Miss,
      };
    });
  }

  private getTopCells(horizontalRange: number[], verticalRange: number[]) {
    return horizontalRange.map((i) => {
      return {
        position: {
          x: i,
          y: verticalRange[0],
        },
        damageType: Damage.Miss,
      };
    });
  }

  private getMappedCells(cells: Cell[]) {
    return cells.reduce(
      (
        result: { [key: string]: { position: { x: number; y: number } } },
        cell: Cell,
      ) => {
        result[getCellId(cell)] = cell;

        return result;
      },
      {},
    );
  }
}
