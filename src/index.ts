/// <reference lib="dom" />

import { Direction, Entity, GameState } from "../game_state.ts";

const ROWS = 50;
const COLS = 100;

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("viewBox", `0 0 ${COLS} ${ROWS}`);
svg.style.width = "100%";
svg.style.height = "100%";
const cells = Array.from(
  { length: ROWS },
  (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      ) as unknown as SVGRectElement;
      rect.setAttribute("x", `${col}`);
      rect.setAttribute("y", `${row}`);
      rect.setAttribute("width", "1");
      rect.setAttribute("height", "1");
      svg.appendChild(rect);
      return rect;
    }),
);
document.body.appendChild(svg);

let direction: keyof typeof Direction | undefined = undefined;
addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
      direction = "Up";
      break;
    case "ArrowRight":
      direction = "Right";
      break;
    case "ArrowDown":
      direction = "Down";
      break;
    case "ArrowLeft":
      direction = "Left";
      break;
  }
});

const state = new GameState(ROWS, COLS);
const session = state[Symbol.iterator]();

const id = setInterval(() => {
  const { done, value } = session.next(direction);
  if (done) {
    clearInterval(id);
  } else {
    for (const [[row, col], entity] of value) {
      switch (entity) {
        case Entity.Empty:
          cells[row][col].setAttribute("fill", "black");
          break;
        case Entity.Food:
          cells[row][col].setAttribute("fill", "red");
          break;
        case Entity.Snake:
          cells[row][col].setAttribute("fill", "green");
          break;
      }
    }
  }
}, 1000 / 15);
