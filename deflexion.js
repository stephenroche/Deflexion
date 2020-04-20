"use strict";

const WIDTH = 10;
const HEIGHT = 8;
const ASPECTS = ['NE', 'SE', 'SW', 'NW'];
const OPPOSITE = {'N': 'S', 'E': 'W', 'S': 'N', 'W': 'E'};
const ANGLES = {'NE': 0, 'SE': Math.PI/2, 'SW': Math.PI, 'NW': 3*Math.PI/2};
const GOLD_PIECE = "#FFF000";
const DARK_GOLD_PIECE = "#BBB000";
const SILVER_PIECE = "#F0F0F0";
const DARK_SILVER_PIECE = "#B0B0B0";
// const BACKGROUND = "#A0A0A0";

function startGame() {              
    gameArea.start();
}

var gameArea = {
    canvas : document.getElementById("gameArea"),
    start : function() {
        this.canvas.width = 100 * (WIDTH + 1);
        this.canvas.height = 100 * (HEIGHT + 1);
        this.ctx = this.canvas.getContext("2d");
        //this.frameNo = 0;
        this.interval = setInterval(this.update.bind(this), 20);
        this.buttons = [new Button(this.canvas.width - 100, this.canvas.height - 25), new Button(100, 25)];
        this.boardState = new BoardState();
        this.rect = this.canvas.getBoundingClientRect();
        this.canvas.addEventListener('mousedown', (e) => {
            this.x = e.x - this.rect.left;
            this.y = e.y - this.rect.top;
            this.clicked = true;
            for (var button of this.buttons) {
                if (button.isClicked(this.x, this.y)) {
                    button.isPressed = true;
                }
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.x = e.x - this.rect.left;
            this.y = e.y - this.rect.top;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.x = false;
            this.y = false;
            this.clicked = false;

            for (var button of this.buttons) {
                button.isPressed = false;
            }
        });
        this.boardState.pieces.set([1, 2], new Pyramid(0, 'SE'));
        this.boardState.pieces.set([5, 3], new Pyramid(1, 'SW'));
        this.boardState.pieces.set([3, 3], new Djed(0, 'NE'));
        this.boardState.pieces.set([0, 0], new Obelisk(1));
        this.boardState.pieces.set([4, 7], new Pharaoh(0));
        this.boardState.setStartState();
    },
    stop : function() {
        clearInterval(this.interval);
    },    
    clear : function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawBackground : function() {
        this.ctx.fillStyle = "#303030";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#606060";
        this.ctx.fillRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);

        for (var i = 0; i < WIDTH; i++) {
            for (var j = 0; j < HEIGHT; j++) {
                this.ctx.translate(50 + 100 * i, 50 + 100 * j);
                this.ctx.fillStyle = "#808080";
                this.ctx.fillRect(5, 5, 95, 95);
                if (i == 0) {
                    this.ctx.fillStyle = "#F0F0F0";
                } else if (i == WIDTH - 1) {
                    this.ctx.fillStyle = "#F0D070";
                } else{
                    this.ctx.fillStyle = "#A0A0A0";
                }
                this.ctx.fillRect(5, 5, 90, 90);
                this.ctx.translate(-(50 + 100 * i), -(50 + 100 * j));
            }
        }
        this.ctx.scale(1 / this.size, 1 / this.size)
    },
    update : function() {
        this.clear();
        this.drawBackground();
        this.buttons[0].draw();
        this.buttons[1].draw();
        this.drawPieces();
    },
    drawPieces : function() {
        for (var [pos, piece] of this.boardState.pieces) {
            var [x, y] = pos;
            var rotation = 0;
            piece.draw(this.ctx, 100 * (x + 1), 100 * (y + 1), rotation);
        }
    }
}

function Button(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.isPressed = false;
    this.draw = function() {
        var ctx = gameArea.ctx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        if (this.isPressed) {
            ctx.fillStyle = "#F06060";
        } else {
            ctx.fillStyle = "#F00000";
        }
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.strokeStyle = "#707070";
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    this.isClicked = function(x, y) {
        var distance = Math.sqrt((x - this.x)**2 + (y - this.y)**2);
        return (distance <= this.radius);
    }
}

class BoardState {
    constructor(turn=0) {
        this.pieces = new Map();
        this.turn = turn;
        this.numTurns = 0;
    }
    setStartState() {
        this.pieces.clear();

        for (var [team, position] of [[0, [4, 7]], [1, [5, 0]]]) {
            this.pieces.set(position, new Pharaoh(team));
        }
        for (var [team, position] of [[0, [3, 7]], [0, [5, 7]], [1, [4, 0]], [1, [6, 0]]]) {
            this.pieces.set(position, new Obelisk(team));
        }
        for (var [team, position, aspect] of [[0, [2, 7], 'NW'], [0, [2, 4], 'NW'], [0, [2, 3], 'SW'], [0, [3, 2], 'NW'], [0, [7, 6], 'NE'], [0, [9, 4], 'SW'], [0, [9, 3], 'NW'], [1, [7, 0], 'SE'], [1, [7, 3], 'SE'], [1, [7, 4], 'NE'], [1, [6, 5], 'SE'], [1, [2, 1], 'SW'], [1, [0, 3], 'NE'], [1, [0, 4], 'SE']]) {
            this.pieces.set(position, new Pyramid(team, aspect));
        }
        for (var [team, position, aspect] of [[0, [4, 4], 'NW'], [0, [5, 4], 'NE'], [1, [4, 3], 'Ne'], [1, [5, 3], 'NW']]) {
            this.pieces.set(position, new Djed(team, aspect));
        }
        // for team, position, aspect in [(0, (4, 3), 'NW'), (0, (5, 3), 'NE'), (1, (4, 4), 'NE'), (1, (5, 4), 'NW')]:
        //     self[position] = Djed(team, aspect)

        this.turn = 0;
        this.numTurns = 0;
    }
}

class Piece {
    constructor(team, aspect=null) {
        this.team = team;
        this.aspect = aspect;
    }
    turn(direction) {
        if (direction == 'L') {
            this.aspect = ASPECTS[(ASPECTS.indexOf(this.aspect) + 3) % 4];
        } else if (direction == 'R') {
            this.aspect = ASPECTS[(ASPECTS.indexOf(this.aspect) + 1) % 4];
        }
    }
    copy() {
        return { ...this };
    }
    draw(ctx, x, y, rotation) {
        if (this.aspect) {
            rotation += ANGLES[this.aspect];
        }
        ctx.translate(x, y);
        ctx.rotate(rotation);
        this.drawIcon(ctx);
        ctx.rotate(-rotation);
        ctx.translate(-x, -y);
    }
    drawIcon(ctx) {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(-49, -49, 98, 98);
    }
}

class Pharaoh extends Piece {
    constructor(team, aspect=null) {
        super(team, aspect);
        this.type = 'Pharaoh';
    }
    getActions() {
        return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW'];
    }
    drawIcon(ctx) {
        if (this.team == 0) {
            var light = GOLD_PIECE;
            var dark = DARK_GOLD_PIECE;
        } else {
            var light = SILVER_PIECE;
            var dark = DARK_SILVER_PIECE;
        }

        ctx.fillStyle = dark;
        ctx.fillRect(-49, -49, 98, 98);

        ctx.beginPath();
        ctx.strokeStyle = light;
        ctx.lineWidth = 8;
        ctx.strokeRect(-45, -45, 90, 90);

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 15);
        ctx.lineTo(-20, 15);
        ctx.closePath()
        ctx.fillStyle = light;
        ctx.fill();
    }
}

class Obelisk extends Piece {
    constructor(team, aspect=null) {
        super(team, aspect);
        this.type = 'Obelisk';
    }
    getActions() {
        return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW'];
    }
    drawIcon(ctx) {
        if (this.team == 0) {
            var light = GOLD_PIECE;
            var dark = DARK_GOLD_PIECE;
        } else {
            var light = SILVER_PIECE;
            var dark = DARK_SILVER_PIECE;
        }

        ctx.fillStyle = dark;
        ctx.fillRect(-49, -49, 98, 98);

        ctx.beginPath();
        ctx.strokeStyle = light;
        ctx.lineWidth = 8;
        ctx.strokeRect(-45, -45, 90, 90);

        ctx.fillStyle = light;
        ctx.fillRect(-30, -30, 60, 60);
    }
}

class Pyramid extends Piece {
    constructor(team, aspect=null) {
        super(team, aspect);
        this.type = 'Pyramid';
    }
    getActions() {
        return ['tL', 'tR', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW'];
    }
    drawIcon(ctx) {
        if (this.team == 0) {
            var light = GOLD_PIECE;
            var dark = DARK_GOLD_PIECE;
        } else {
            var light = SILVER_PIECE;
            var dark = DARK_SILVER_PIECE;
        }

        ctx.fillStyle = dark;
        ctx.fillRect(-49, -49, 98, 98);

        ctx.beginPath();
        ctx.moveTo(-49, -49);
        ctx.lineTo(49, 49);
        ctx.lineTo(-49, 49);
        ctx.closePath();
        ctx.fillStyle = light;
        ctx.fill();

        ctx.beginPath();
        ctx.rect(-45, -45, 90, 90);
        ctx.lineTo(45, 45);
        ctx.strokeStyle = light;
        ctx.lineWidth = 8;
        ctx.stroke();
    }
}

class Djed extends Piece {
    constructor(team, aspect=null) {
        super(team, aspect);
        this.type = 'Djed';
    }
    getActions() {
        if (this.aspect == 'NE') {
            return ['tL', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW'];
        } else if (this.aspect == 'NW') {
            return ['tR', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW'];
        }
    }
    drawIcon(ctx) {
        if (this.team == 0) {
            var light = GOLD_PIECE;
            var dark = DARK_GOLD_PIECE;
        } else {
            var light = SILVER_PIECE;
            var dark = DARK_SILVER_PIECE;
        }

        ctx.fillStyle = dark;
        ctx.fillRect(-49, -49, 98, 98);

        ctx.beginPath();
        ctx.rect(-45, -45, 90, 90);
        ctx.lineTo(45, 45);
        ctx.strokeStyle = light;
        ctx.lineWidth = 8;
        ctx.stroke();
    }
}