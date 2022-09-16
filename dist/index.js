// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const Direction = {
    Right: [
        0,
        1
    ],
    Up: [
        -1,
        0
    ],
    Left: [
        0,
        -1
    ],
    Down: [
        1,
        0
    ]
};
var Status;
(function(Status) {
    Status[Status["Loose"] = -1] = "Loose";
    Status[Status["Ongoing"] = 0] = "Ongoing";
    Status[Status["Win"] = 1] = "Win";
})(Status || (Status = {}));
var Entity;
(function(Entity) {
    Entity[Entity["Empty"] = 0] = "Empty";
    Entity[Entity["Food"] = 1] = "Food";
    Entity[Entity["Snake"] = 2] = "Snake";
})(Entity || (Entity = {}));
class GameState {
    #board;
    #empty;
    #foods;
    #snake;
    #velocity;
    #status;
    n_foods;
    constructor(n, m, { n_foods =1  } = {}){
        this.n = n;
        this.m = m;
        this.#foods = [];
        this.#snake = [];
        this.#velocity = Direction.Right;
        this.#status = Status.Ongoing;
        this.#empty = [];
        this.#board = Array.from({
            length: n
        }, (_, i)=>{
            return Array.from({
                length: m
            }, (_, j)=>{
                this.#empty.push([
                    i,
                    j
                ]);
                return [
                    Entity.Empty,
                    n * i + j
                ];
            });
        });
        this.n_foods = n_foods;
    }
    *[Symbol.iterator]() {
        let direction = yield this.#initialize();
        let [i, j] = this.#snake[0];
        while(this.#status === Status.Ongoing){
            const [dI, dJ] = this.#turn(direction);
            const head = [i, j] = [
                mod(i + dI, this.n),
                mod(j + dJ, this.m)
            ];
            direction = yield this.#update(head);
        }
    }
     #initialize() {
        const i = Math.floor(this.n / 2);
        const j = Math.floor(this.m / 2);
        this.#board[i][j] = [
            Entity.Snake,
            NaN
        ];
        this.#snake.unshift([
            i,
            j
        ]);
        return [
            [
                Entity.Snake,
                [
                    i,
                    j
                ]
            ],
            ...this.#addFoods()
        ];
    }
     #turn(direction) {
        if (direction) {
            const velocity = Direction[direction];
            if (velocity[0] === this.#velocity[1] || velocity[1] === this.#velocity[0]) {
                this.#velocity = velocity;
            }
        }
        return this.#velocity;
    }
     #update(head) {
        const [i1, j1] = head;
        const [entity, index] = this.#board[i1]?.[j1] ?? [
            Entity.Snake,
            NaN
        ];
        switch(entity){
            case Entity.Empty:
                {
                    this.#board[i1][j1] = [
                        Entity.Snake,
                        NaN
                    ];
                    this.#snake.unshift(head);
                    swapRemove(this.#empty, index);
                    const tail = this.#snake.pop();
                    const [k, l] = tail;
                    this.#board[k][l] = [
                        Entity.Empty,
                        this.#empty.length
                    ];
                    this.#empty.push(tail);
                    return [
                        [
                            Entity.Snake,
                            head
                        ],
                        [
                            Entity.Empty,
                            tail
                        ]
                    ];
                }
            case Entity.Food:
                this.#board[i1][j1] = [
                    Entity.Snake,
                    NaN
                ];
                this.#snake.unshift(head);
                swapRemove(this.#foods, index);
                return [
                    [
                        Entity.Snake,
                        head
                    ],
                    ...this.#addFoods()
                ];
            default:
                this.#status = this.#empty.length ? Status.Loose : Status.Win;
                return [];
        }
    }
     #addFoods() {
        const n = Math.min(this.n_foods - this.#foods.length, this.#empty.length);
        return Array.from({
            length: n
        }, ()=>{
            const index = randRange(this.#empty.length);
            const [i, j] = this.#empty[index];
            this.#board[i][j] = [
                Entity.Food,
                this.#foods.length
            ];
            this.#foods.push([
                i,
                j
            ]);
            swapRemove(this.#empty, index);
            return [
                Entity.Food,
                [
                    i,
                    j
                ]
            ];
        });
    }
    n;
    m;
}
function mod(n, m) {
    return (n % m + m) % m;
}
function randRange(length) {
    return Math.floor(Math.random() * length);
}
function swapRemove(array, i) {
    if (i === array.length - 1) {
        array.length--;
    } else {
        array[i] = array.pop();
    }
}
const state = new GameState(50, 100);
const session = state[Symbol.iterator]();
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("viewBox", `0 0 ${100} ${50}`);
svg.style.width = "100%";
svg.style.height = "100%";
const cells = Array.from({
    length: 50
}, (_, row)=>Array.from({
        length: 100
    }, (_, col)=>{
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", `${col}`);
        rect.setAttribute("y", `${row}`);
        rect.setAttribute("width", "1");
        rect.setAttribute("height", "1");
        svg.appendChild(rect);
        return rect;
    }));
document.body.appendChild(svg);
let direction1 = undefined;
addEventListener("keydown", (event)=>{
    switch(event.key){
        case "ArrowUp":
            direction1 = "Up";
            break;
        case "ArrowRight":
            direction1 = "Right";
            break;
        case "ArrowDown":
            direction1 = "Down";
            break;
        case "ArrowLeft":
            direction1 = "Left";
            break;
    }
});
const id = setInterval(()=>{
    const { done , value  } = session.next(direction1);
    if (done) {
        clearInterval(id);
    } else {
        for (const [entity, [row, col]] of value){
            switch(entity){
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
