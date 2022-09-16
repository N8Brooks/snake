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
var Conclusion;
(function(Conclusion) {
    Conclusion[Conclusion["Loose"] = -1] = "Loose";
    Conclusion[Conclusion["Ongoing"] = 0] = "Ongoing";
    Conclusion[Conclusion["Win"] = 1] = "Win";
})(Conclusion || (Conclusion = {}));
var Entity;
(function(Entity) {
    Entity["Empty"] = "empty";
    Entity["Snake"] = "snake";
    Entity["Food"] = "food";
})(Entity || (Entity = {}));
class GameState {
    #snake;
    #empty;
    #foods;
    #velocity;
    #status;
    constructor(n, m){
        this.n = n;
        this.m = m;
        this.#foods = new Set();
        this.#velocity = Direction.Right;
        this.#status = Conclusion.Ongoing;
        this.#empty = new Set(Array.from({
            length: n
        }, (_, row)=>row).flatMap((row)=>Array.from({
                length: m
            }, (_, col)=>[
                    row,
                    col
                ])).map((coordinate)=>coordinate.join()));
        this.#snake = [
            [
                Math.floor(n / 2),
                Math.floor(m / 2)
            ]
        ];
        this.#empty.delete(this.#snake[0].join());
        this.#addFoods();
    }
    *[Symbol.iterator]() {
        yield [
            ...this.#snake.map((coordinate)=>[
                    coordinate,
                    Entity.Snake
                ]),
            ...[
                ...this.#foods
            ].map((key)=>{
                const coordinate = key.split(",").map((d)=>+d);
                return [
                    coordinate,
                    Entity.Food
                ];
            }), 
        ];
        while(this.#status === Conclusion.Ongoing){
            const head = [
                this.#velocity[0] + this.#snake[0][0],
                this.#velocity[1] + this.#snake[0][1], 
            ];
            this.#turn((yield this.#update(head)));
        }
    }
     #turn(direction) {
        if (!direction) {
            return;
        }
        const velocity = Direction[direction];
        if (!!velocity[0] !== !!this.#velocity[0] && !!velocity[1] !== !!this.#velocity[1]) {
            this.#velocity = velocity;
        }
    }
     #update(head) {
        const key = head.join();
        if (this.#empty.has(key)) {
            this.#empty.delete(key);
            this.#snake.unshift(head);
            const tail = this.#snake.pop();
            this.#empty.add(tail.join());
            return [
                [
                    head,
                    Entity.Snake
                ],
                [
                    tail,
                    Entity.Empty
                ], 
            ];
        } else if (this.#foods.has(key)) {
            this.#foods.delete(key);
            this.#snake.unshift(head);
            return [
                [
                    head,
                    Entity.Snake
                ],
                ...this.#addFoods()
            ];
        } else {
            this.#status = this.#empty.size ? Conclusion.Loose : Conclusion.Win;
            return [];
        }
    }
     #addFoods() {
        const k = 3 - this.#foods.size;
        return sample(this.#empty, k).map((key)=>{
            this.#empty.delete(key);
            this.#foods.add(key);
            const coordinate = key.split(",").map((d)=>+d);
            return [
                coordinate,
                Entity.Food
            ];
        });
    }
    n;
    m;
}
function sample(iterable, k) {
    const reservoir = [];
    let w = Math.exp(Math.log(Math.random()) / k);
    let t = k + Math.floor(Math.log(Math.random()) / Math.log(1 - w));
    for (const element of iterable){
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
const state = new GameState(50, 100);
const session = state[Symbol.iterator]();
const id = setInterval(()=>{
    const { done , value  } = session.next(direction1);
    if (done) {
        clearInterval(id);
    } else {
        for (const [[row, col], entity] of value){
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
