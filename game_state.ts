export const Direction = {
  Right: [0, 1],
  Up: [-1, 0],
  Left: [0, -1],
  Down: [1, 0],
} as const;

const N_FOODS = 3;

export enum Conclusion {
  Loose = -1,
  Ongoing = 0,
  Win = 1,
}

export enum Entity {
  Empty = "empty",
  Snake = "snake",
  Food = "food",
}

export class GameState {
  #snake: [number, number][];
  #empty: Set<string>;
  #foods: Set<string> = new Set();
  #velocity: typeof Direction[keyof typeof Direction] = Direction.Right;
  #status = Conclusion.Ongoing;

  constructor(public readonly n: number, public readonly m: number) {
    this.#empty = new Set(
      Array.from({ length: n }, (_, row) => row).flatMap((row) =>
        Array.from({ length: m }, (_, col): [number, number] => [row, col])
      ).map((coordinate) => coordinate.join()),
    );
    this.#snake = [[Math.floor(n / 2), Math.floor(m / 2)]];
    this.#empty.delete(this.#snake[0].join());
    this.#addFoods();
  }

  *[Symbol.iterator](): Generator<[[number, number], Entity][]> {
    // Initialize board
    yield [
      ...this.#snake.map((coordinate) => [coordinate, Entity.Snake]),
      ...[...this.#foods].map((key) => {
        const coordinate = key.split(",").map((d) => +d);
        return [coordinate, Entity.Food];
      }),
    ] as [[number, number], Entity][];

    // Game loop
    while (this.#status === Conclusion.Ongoing) {
      const head: [number, number] = [
        this.#velocity[0] + this.#snake[0][0],
        this.#velocity[1] + this.#snake[0][1],
      ];
      this.#turn(
        (yield this.#update(head)) as keyof typeof Direction | undefined,
      );
    }
  }

  #turn(direction?: keyof typeof Direction) {
    if (!direction) {
      return;
    }
    const velocity = Direction[direction];
    if (
      !!velocity[0] !== !!this.#velocity[0] &&
      !!velocity[1] !== !!this.#velocity[1]
    ) {
      this.#velocity = velocity;
    }
  }

  #update(head: [number, number]): [[number, number], Entity][] {
    const key = head.join();
    if (this.#empty.has(key)) {
      // console.debug("Hit nothing");
      this.#empty.delete(key);
      this.#snake.unshift(head);
      const tail = this.#snake.pop()!;
      this.#empty.add(tail.join());
      return [
        [head, Entity.Snake],
        [tail, Entity.Empty],
      ];
    } else if (this.#foods.has(key)) {
      // console.debug("Hit food");
      this.#foods.delete(key);
      this.#snake.unshift(head);
      return [[head, Entity.Snake], ...this.#addFoods()];
    } else {
      // console.debug("Hit wall or snake");
      this.#status = this.#empty.size ? Conclusion.Loose : Conclusion.Win;
      return [];
    }
  }

  #addFoods(): [[number, number], Entity][] {
    const k = N_FOODS - this.#foods.size;
    return sample(this.#empty, k).map((key) => {
      this.#empty.delete(key);
      this.#foods.add(key);
      const coordinate = key.split(",").map((d) => +d) as [number, number];
      return [coordinate, Entity.Food];
    });
  }
}

function sample<T>(iterable: Iterable<T>, k: number) {
  const reservoir: T[] = [];
  let w = Math.exp(Math.log(Math.random()) / k);
  let t = k + Math.floor(Math.log(Math.random()) / Math.log(1 - w));
  for (const element of iterable) {
    if (reservoir.length < k) {
      reservoir.push(element);
    } else if (t == 0) {
      reservoir[Math.floor(Math.random() * k)] = element;
      w *= Math.exp(Math.log(Math.random()) / k);
      t = Math.floor(Math.log(Math.random()) / Math.log(1 - w)) + 1;
    } else {
      t--;
    }
  }
  return reservoir;
}
