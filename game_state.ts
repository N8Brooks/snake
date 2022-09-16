/** Snake directions */
export const Direction = {
  Right: [0, 1],
  Up: [-1, 0],
  Left: [0, -1],
  Down: [1, 0],
} as const;

/** `GameState` overall status */
export enum Status {
  Loose = -1,
  Ongoing = 0,
  Win = 1,
}

/** Board elements */
export enum Entity {
  Empty,
  Food,
  Snake,
}

/** Summarizes changes with the new `Entity` at the row and col index */
export type Update = [Entity, [number, number]];

export class GameState {
  /** `Entity` and entity specific collection index pair */
  #board: [Entity, number][][];

  /** Unordered row and column index pairs of `Empty` entities */
  #empty: [number, number][];

  /** Unordered row and column index pairs of `Food` entities */
  #foods: [number, number][] = [];

  /** Queue containing row and column index pairs of `Snake` entities */
  #snake: [number, number][] = [];

  /** Delta row and column index pair applied every game loop */
  #velocity: typeof Direction[keyof typeof Direction] = Direction.Right;

  /** Game status */
  #status = Status.Ongoing;

  /** Option defining maximum number of `Food` entities in `GameState` */
  readonly n_foods: number;

  constructor(
    public readonly n: number,
    public readonly m: number,
    { n_foods = 1 } = {},
  ) {
    this.#empty = [];
    this.#board = Array.from({ length: n }, (_, i) => {
      return Array.from({ length: m }, (_, j) => {
        this.#empty.push([i, j]);
        return [Entity.Empty, n * i + j];
      });
    });
    this.n_foods = n_foods;
  }

  /** Game loop */
  *[Symbol.iterator](): Generator<
    Update[],
    void,
    keyof typeof Direction | undefined
  > {
    let direction = yield this.#initialize();
    let [i, j] = this.#snake[0];
    while (this.#status === Status.Ongoing) {
      const [dI, dJ] = this.#turn(direction);
      const head = [i, j] = [mod(i + dI, this.n), mod(j + dJ, this.m)];
      direction = yield this.#update(head);
    }
  }

  /** Add snake */
  #initialize(): Update[] {
    const i = Math.floor(this.n / 2);
    const j = Math.floor(this.m / 2);
    // `Snake` entity indexes are unnecessary and can change
    this.#board[i][j] = [Entity.Snake, NaN];
    this.#snake.unshift([i, j]);
    return [[Entity.Snake, [i, j]], ...this.#addFoods()];
  }

  /** Turn horizontal if vertical and vise versa */
  #turn(direction?: keyof typeof Direction) {
    if (direction) {
      const velocity = Direction[direction];
      if (
        velocity[0] === this.#velocity[1] || velocity[1] === this.#velocity[0]
      ) {
        this.#velocity = velocity;
      }
    }
    return this.#velocity;
  }

  /** Transform game state with given row-col index pair, `head` */
  #update(head: [number, number]): Update[] {
    const [i, j] = head;
    const [entity, index] = this.#board[i]?.[j] ?? [Entity.Snake, NaN]; // wall
    switch (entity) {
      case Entity.Empty: {
        this.#board[i][j] = [Entity.Snake, NaN];
        this.#snake.unshift(head);
        swapRemove(this.#empty, index);
        const tail = this.#snake.pop()!;
        const [k, l] = tail;
        this.#board[k][l] = [Entity.Empty, this.#empty.length];
        this.#empty.push(tail);
        return [[Entity.Snake, head], [Entity.Empty, tail]];
      }
      case Entity.Food:
        this.#board[i][j] = [Entity.Snake, NaN];
        this.#snake.unshift(head);
        swapRemove(this.#foods, index);
        return [[Entity.Snake, head], ...this.#addFoods()];
      default:
        this.#status = this.#empty.length ? Status.Loose : Status.Win;
        return [];
    }
  }

  /** Adds up to `n_foods` food entities into the game state */
  #addFoods(): Update[] {
    const n = Math.min(this.n_foods - this.#foods.length, this.#empty.length);
    return Array.from({ length: n }, () => {
      const index = randRange(this.#empty.length);
      const [i, j] = this.#empty[index];
      this.#board[i][j] = [Entity.Food, this.#foods.length];
      this.#foods.push([i, j]);
      swapRemove(this.#empty, index);
      return [Entity.Food, [i, j]];
    });
  }
}

/** JavaScript modulo operation */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Random integer in [`0`, `length`) */
function randRange(length: number): number {
  return Math.floor(Math.random() * length);
}

/** O(1) operation to remove an element *without* preserving order */
function swapRemove<T>(array: T[], i: number) {
  if (i === array.length - 1) {
    array.length--;
  } else {
    array[i] = array.pop()!;
  }
}
