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
        this.laserPath = [];
        this.canvas.addEventListener('mousedown', (e) => {
            this.x = e.x - this.rect.left;
            this.y = e.y - this.rect.top;
            this.clicked = true;
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].isClicked(this.x, this.y)) {
                    this.buttons[i].isPressed = true;
                    this.fireLaser(i);
                    break;
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
            this.stopLaser();
        });
        // this.boardState[1][2] = new Pyramid(0, 'SE');
        // this.boardState[5][3] = new Pyramid(1, 'SW');
        // this.boardState[3][3] = new Djed(0, 'NE');
        // this.boardState[0][0] = new Obelisk(1);
        // this.boardState[4][7] = new Pharaoh(0);
        // console.log(this.boardState);
        this.boardState.setStartState();
        // this.boardState[1][3] = new Obelisk(0);
        this.boardState[2][4].aspect = 'NE';
        // console.log(this.boardState.isWinState());
        // console.log(this.boardState.getLaserPath(0));
        // console.log(this.boardState.getLaserPath(1));
        // this.laserPath = this.boardState.getLaserPath(1);
        // this.fireLaser(1);
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
        this.drawLaser();
    },
    drawPieces : function() {
        for (var [pos, piece] of this.boardState) {
            var [x, y] = pos;
            var rotation = 0;
            piece.draw(this.ctx, 100 * (x + 1), 100 * (y + 1), rotation);
        }
    },
    fireLaser : function(laser) {
        let fullPath = this.boardState.getLaserPath(laser);
        let len = fullPath.length;
        let [x1, y1] = fullPath[0];
        let [x2, y2] = fullPath[1];
        fullPath[0] = [(x1 + x2) / 2, (y1 + y2) / 2];
        [x1, y1] = fullPath[len - 3];
        [x2, y2] = fullPath[len - 2];
        if (fullPath[len - 1] == 'hit') {
            this.pieceHit = [...fullPath[len - 2]];
            fullPath[len - 2] = [0.3 * x1 + 0.7 * x2, 0.3 * y1 + 0.7 * y2];
        } else {
            fullPath[len - 2] = [0.5 * x1 + 0.5 * x2, 0.5 * y1 + 0.5 * y2];
        }
        fullPath.pop();
        len--;

        this.laserPath = [];
        this.laserInterval = setInterval(() => {
            let drawnLength = this.laserPath.length;
            if (drawnLength != len) {
                this.laserPath.push(fullPath[drawnLength]);
            }
        }, 50);
    },
    stopLaser : function() {
        clearInterval(this.laserInterval);
        this.laserPath = [];
        if (this.pieceHit) {
            let [x, y] = this.pieceHit;
            delete this.boardState[x][y];
            delete this.pieceHit;
        }
    },
    drawLaser : function() {
        if (!this.laserPath.length) {
            return;
        }
        this.ctx.beginPath();
        let [x, y] = this.laserPath[0];
        this.ctx.moveTo(100 * (x + 1), 100 * (y + 1));
        for (let [x, y] of this.laserPath.slice(1)) {
            this.ctx.lineTo(100 * (x + 1), 100 * (y + 1));
        }
        // this.ctx.strokeStyle = 'rgba(1,0,0,0.4)'; // rgba printing black for some reason
        this.ctx.strokeStyle = 'hsla(0, 100%, 50%, 0.5)';
        this.ctx.lineWidth = 10;
        this.ctx.lineJoin = "bevel";
        this.ctx.stroke();
        this.ctx.lineJoin = "mitre";
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


class BoardState extends Array {
    constructor(turn=0) {
        super();
        this.clear()
        this.turn = turn;
        this.numTurns = 0;
    }
    [Symbol.iterator]() {
        let index = 0;
        let x = 0;
        let y = -1;
        return {
            next: () => {
                let runOnce = false;
                while ((x < WIDTH && !this[x][y]) || !runOnce) {
                    runOnce = true;
                    if (y < HEIGHT - 1) {
                        y++;
                    } else {
                        x++;
                        y = 0;
                    }
                }

                if (x < WIDTH) {
                    return {value: [[x, y], this[x][y]], done: false}
                } else {
                    return {done: true}
                }
            }
        }
    }
    clear() {
        for (let x = 0; x < WIDTH; x++) {
            this[x] = [];
        }
    }
    setStartState() {
        this.clear();

        for (const [team, [x, y]] of [[0, [4, 7]], [1, [5, 0]]]) {
            this[x][y] = new Pharaoh(team);
        }
        for (var [team, [x, y]] of [[0, [3, 7]], [0, [5, 7]], [1, [4, 0]], [1, [6, 0]]]) {
            this[x][y] = new Obelisk(team);
        }
        for (var [team, [x, y], aspect] of [[0, [2, 7], 'NW'], [0, [2, 4], 'NW'], [0, [2, 3], 'SW'], [0, [3, 2], 'NW'], [0, [7, 6], 'NE'], [0, [9, 4], 'SW'], [0, [9, 3], 'NW'], [1, [7, 0], 'SE'], [1, [7, 3], 'SE'], [1, [7, 4], 'NE'], [1, [6, 5], 'SE'], [1, [2, 1], 'SW'], [1, [0, 3], 'NE'], [1, [0, 4], 'SE']]) {
            this[x][y] = new Pyramid(team, aspect);
        }
        for (var [team, [x, y], aspect] of [[0, [4, 4], 'NW'], [0, [5, 4], 'NE'], [1, [4, 3], 'NE'], [1, [5, 3], 'NW']]) {
            this[x][y] = new Djed(team, aspect);
        }

        this.turn = 0;
        this.numTurns = 0;
    }
    isWinState() {
        var pharaohsFound = [false, false];

        for (const [pos, piece] of this) {
            if (piece.type == 'Pharaoh') {
                pharaohsFound[piece.team] = true;
            }
        }
        if (pharaohsFound[0] && pharaohsFound[1]) {
            return false;
        } else if (pharaohsFound[0]) {
            return 'Win_0';
        } else if (pharaohsFound[1]) {
            return 'Win_1';
        } else {
            alert('Error: no pharaohs');
            return 'Error';
        }
    }
    // def get_valid_moves(self):
    //     valid_moves = []
    //     for piece_pos, piece in self.items():
    //         if piece.team != self.turn:
    //             continue

    //         for action in piece.get_actions():
    //             next_x, next_y = piece_pos

    //             if action[0] == 'm':
    //                 if 'N' in action:
    //                     next_y += 1
    //                 elif 'S' in action:
    //                     next_y -= 1

    //                 if 'E' in action:
    //                     next_x += 1
    //                 elif 'W' in action:
    //                     next_x -= 1

    //                 if (next_x, next_y) in self and not (isinstance(piece, Djed) and isinstance(self[next_x, next_y], (Pyramid, Obelisk)) and (piece_pos[0] != (self.width - 1) * (1 - piece.team))):
    //                     continue

    //                 if next_x < 0 or next_x >= self.width or next_x == (self.width - 1) * piece.team:
    //                     continue

    //                 if next_y < 0 or next_y >= self.height:
    //                     continue

    //             valid_moves.append( (piece_pos, action) )

    //     return valid_moves

    // def make_move(self, move, check_valid=False):
    //     if check_valid and move not in self.get_valid_moves():
    //         print('Board before invalid move:')
    //         print(self)
    //         print('Invalid move: ' + str(move))
    //         return

    //     piece_pos, action = move
    //     piece = self[piece_pos]
    //     if action[0] == 't':
    //         piece.turn(action[1])

    //     elif action[0] == 'm':
    //         next_x, next_y = piece_pos

    //         if 'N' in action:
    //             next_y += 1
    //         elif 'S' in action:
    //             next_y -= 1

    //         if 'E' in action:
    //             next_x += 1
    //         elif 'W' in action:
    //             next_x -= 1

    //         swapped_piece = self[(next_x, next_y)] # Can be None
    //         self[(next_x, next_y)] = piece
    //         if swapped_piece:
    //             self[piece_pos] = swapped_piece
    //         else:
    //             del self[piece_pos]

    //     self.turn = 1 - self.turn
    //     self.num_turns += 1

    copy() {
        var copied_board = new BoardState(this.turn);
        for (const [[x, y], piece] of this) {
            copied_board[x][y] = piece.copy();
        }

        return copied_board;
    }

    // def get_successor_state(self, move=None, laser=None):
    //     next_board_state = self.copy()

    //     if move != None:
    //         next_board_state.make_move(move)

    //     if laser != None:
    //         next_board_state.fire_laser(laser)

    //     return next_board_state

    getPath(start_pos, start_direction) {
        var path = [];
        var [x, y] = start_pos;
        var direction = start_direction;
        while (true) {
            path.push([x, y]);
            if (path.length > 1 && (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)) {
                path.push('safe');
                break;
            }

            if (this[x][y]) {
                var piece = this[x][y];

                if (['Pharaoh', 'Obelisk'].includes(piece.type)) {
                    path.push('hit');
                    break;
                } else if (piece.type == 'Pyramid') {
                    if (piece.aspect.includes(direction)) {
                        path.push('hit');
                        break;
                    } else {
                        direction = piece.aspect.replace(OPPOSITE[direction], '');
                    }
                } else if (piece.type == 'Djed') {
                    var aspect = piece.aspect;
                    if (aspect.includes(direction)) {
                        aspect = [OPPOSITE[aspect[0]], OPPOSITE[aspect[1]]].join('');
                    }
                    direction = aspect.replace(OPPOSITE[direction], '');
                }
            }

            if (direction == 'N') {
                y -= 1;
            } else if (direction == 'S') {
                y += 1;
            } else if (direction == 'E') {
                x += 1;
            } else if (direction == 'W') {
                x -= 1;
            }
        }
        return path;
    }
    getLaserPath(laser) {
        if (laser == 0) {
            return this.getPath([9, 8], 'N');
        } else if (laser == 1) {
            return this.getPath([0, -1], 'S');
        }
    }
    // def fire_laser(self, laser):
    //     hit_pos = self.get_laser_path(laser)[-1]
    //     if hit_pos:
    //         del self[hit_pos]
    //     return hit_pos
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}