"use strict";

const WIDTH = 10;
const HEIGHT = 8;
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
    get hoverSquare() {
        if (!this.grabbedPiece) {
            return null;
        }
        let [grabbedPieceX, grabbedPieceY] = this.grabbedPiece;
        let hoverX = grabbedPieceX + Math.round((this.pixelX - this.grabbedPixelX) / 100);
        let hoverY = grabbedPieceY + Math.round((this.pixelY - this.grabbedPixelY) / 100);
        return  [hoverX, hoverY];
    },
    get turnedAngle() {
        if (!this.grabbedAngle) {
            return 0;
        }
        let [grabbedPieceX, grabbedPieceY] = this.grabbedPiece;
        let diffX = this.pixelX - 100 * (grabbedPieceX + 1);
        let diffY = this.pixelY - 100 * (grabbedPieceY + 1);
        return getAngle(diffX, diffY) - this.grabbedAngle;
    },
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

        this.canvas.addEventListener('mouseover', (e) => {
            this.pixelX = e.x - this.rect.left;
            this.pixelY = e.y - this.rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            // this.clicked = true;
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].isClicked(this.pixelX, this.pixelY)) {
                    this.buttons[i].isPressed = true;
                    this.fireLaser(i);
                    return;
                }
            }
            let [squareX, squareY] = this.pixelToSquare(this.pixelX, this.pixelY);
            if (this.boardState[squareX][squareY]) {
                this.grabbedPiece = [squareX, squareY];
                let diffX = this.pixelX - 100 * (squareX + 1);
                let diffY = this.pixelY - 100 * (squareY + 1);
                let distFromCentre = Math.sqrt(diffX**2 + diffY**2);
                if (20 < distFromCentre && distFromCentre < 40 && ['Pyramid', 'Djed'].includes(this.boardState[squareX][squareY].type)) {
                    this.grabbedAngle = getAngle(diffX, diffY);
                } else {
                    this.grabbedPixelX = this.pixelX;
                    this.grabbedPixelY = this.pixelY;
                }
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.pixelX = e.x - this.rect.left;
            this.pixelY = e.y - this.rect.top;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            for (var button of this.buttons) {
                button.isPressed = false;
            }
            this.stopLaser();
            if (this.grabbedPiece) {
                this.dropPiece();
            }
            // this.clicked = false;
        });
        this.canvas.addEventListener('mouseleave', (e) => {
            this.pixelX = false;
            this.pixelY = false;
        });
        this.boardState.setStartState();
        console.log(this.boardState.getValidMoves());
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
        if (this.grabbedPiece) {
            var [grabbedPieceX, grabbedPieceY] = this.grabbedPiece;
        }
        for (let [pos, piece] of this.boardState) {
            let [x, y] = pos;
            if (this.grabbedPiece && x === grabbedPieceX && y === grabbedPieceY) {
                continue;
            }
            piece.draw(this.ctx, 100 * (x + 1), 100 * (y + 1), 0);
        }
        if (this.grabbedPiece) {
            let piece = this.boardState[grabbedPieceX][grabbedPieceY];
            let drawX = 100 * (grabbedPieceX + 1);
            let drawY = 100 * (grabbedPieceY + 1);
            let rotation = 0;
            if (this.grabbedAngle) {
                rotation += this.turnedAngle;
            } else {
                this.drawGlow();
                drawX += this.pixelX - this.grabbedPixelX;
                drawY += this.pixelY - this.grabbedPixelY;
            }
            
            piece.draw(this.ctx, drawX, drawY, rotation);
        } else if (this.pixelX) {
            this.drawSwivel();
        }

    },
    drawGlow : function() {
        let [glowX, glowY] = this.hoverSquare;
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'hsla(0, 100%, 50%, 0.5)';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(100 * (glowX + 1) - 45, 100 * (glowY + 1) - 45, 90, 90);
    },
    drawSwivel : function() {
        let [x, y] = this.pixelToSquare(this.pixelX, this.pixelY);
        if (this.boardState[x] && this.boardState[x][y] && ['Pyramid', 'Djed'].includes(this.boardState[x][y].type)) {
            this.ctx.lineWidth = 4;
            // this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = "hsla(0, 0%, 40%, 0.7)";
            let radius = 30;
            this.ctx.beginPath();
            this.ctx.arc(100 * (x + 1), 100 * (y + 1), radius, 0, 0.85 * Math.PI);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(100 * (x + 1), 100 * (y + 1), radius, Math.PI, 1.85 * Math.PI);
            this.ctx.stroke();
            let headLength = 7;
            this.ctx.beginPath();
            this.ctx.moveTo(100 * (x + 1) + radius - headLength, 100 * (y + 1) + headLength);
            this.ctx.lineTo(100 * (x + 1) + radius, 100 * (y + 1));
            this.ctx.lineTo(100 * (x + 1) + radius + headLength, 100 * (y + 1) + headLength);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(100 * (x + 1) - radius - headLength, 100 * (y + 1) - headLength);
            this.ctx.lineTo(100 * (x + 1) - radius, 100 * (y + 1));
            this.ctx.lineTo(100 * (x + 1) - radius + headLength, 100 * (y + 1) - headLength);
            this.ctx.stroke();
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
    },
    pixelToSquare : function(pixelX, pixelY) {
        let square_x = Math.round(pixelX / 100) - 1;
        let square_y = Math.round(pixelY / 100) - 1;
        return [square_x, square_y];
    },
    dropPiece : function() {
        let [oldX, oldY] = this.grabbedPiece;
        if (this.grabbedPixelX) {
            let [newX, newY] = this.hoverSquare;
            if (this.boardState[newX][newY]) {
                let swapped_piece = this.boardState[newX][newY]
                this.boardState[newX][newY] = this.boardState[oldX][oldY];
                this.boardState[oldX][oldY] = swapped_piece;
            } else {
                this.boardState[newX][newY] = this.boardState[oldX][oldY];
                delete this.boardState[oldX][oldY];
            }
        } else {
            let turnedAngle = this.turnedAngle;
            if (0.25 * Math.PI < turnedAngle && turnedAngle < 0.75 * Math.PI) {
                this.boardState[oldX][oldY].turn('R');
            } else if (-0.75 * Math.PI < turnedAngle && turnedAngle < -0.25 * Math.PI) {
                this.boardState[oldX][oldY].turn('L');
            }
        }
        this.grabbedPiece = false;
        this.grabbedPixelX = false;
        this.grabbedPixelY = false;
        this.grabbedAngle = false;
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
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        if (this.isPressed) {
            ctx.fillStyle = "#F06060";
        } else {
            ctx.fillStyle = "#F00000";
        }
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#707070";
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    this.isClicked = function(pixelX, pixelY) {
        var distance = Math.sqrt((pixelX - this.x)**2 + (pixelY - this.y)**2);
        return (distance <= this.radius);
    }
}


function getAngle(x, y) {
    if (x >= 0) {
        return Math.atan(y / x);
    } else {
        return Math.atan(y / x) + Math.PI;
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
        for (var [team, [x, y], aspect] of [[0, [2, 7], [-1, -1]], [0, [2, 4], [-1, -1]], [0, [2, 3], [-1, 1]], [0, [3, 2], [-1, -1]], [0, [7, 6], [1, -1]], [0, [9, 4], [-1, 1]], [0, [9, 3], [-1, -1]], [1, [7, 0], [1, 1]], [1, [7, 3], [1, 1]], [1, [7, 4], [1, -1]], [1, [6, 5], [1, 1]], [1, [2, 1], [-1, 1]], [1, [0, 3], [1, -1]], [1, [0, 4], [1, 1]]]) {
            this[x][y] = new Pyramid(team, aspect);
        }
        for (var [team, [x, y], aspect] of [[0, [4, 4], [-1, -1]], [0, [5, 4], [1, -1]], [1, [4, 3], [1, -1]], [1, [5, 3], [-1, -1]]]) {
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
    getValidMoves() {
        let valid_moves = [];
        for (let [piecePos, piece] of this) {
            if (piece.team != this.turn) {
                continue;
            }

            for (let action of piece.getActions()) {
                let [nextX, nextY] = piecePos;

                if (action[0] == 'm') {
                    nextX += action[1];
                    nextY += action[2];

                    if (nextX < 0 || nextX >= WIDTH || nextX == (WIDTH - 1) * piece.team) {
                        continue;
                    }

                    if (nextY < 0 || nextY >= HEIGHT) {
                        continue;
                    }

                    if (this[nextX][nextY] && !(piece.type == 'Djed' && ['Pyramid', 'Obelisk'].includes(this[nextX][nextY].type) && (piecePos[0] != (WIDTH - 1) * (1 - piece.team)))) {
                        continue;
                    }
                }
                valid_moves.push([piecePos, action]);
            }
        }
        return valid_moves;
    }
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
                    if (piece.aspect[0] * direction[0] + piece.aspect[1] * direction[1] == 1) {
                        path.push('hit');
                        break;
                    } else {
                        if (direction[0]) {
                            direction = [0, piece.aspect[1]];
                        } else {
                            direction = [piece.aspect[0], 0];
                        }
                    }
                } else if (piece.type == 'Djed') {
                    var aspect = piece.aspect;
                    if (aspect[0] * direction[0] + aspect[1] * direction[1] == 1) {
                        aspect = [-aspect[0], -aspect[1]];
                    }
                    if (direction[0]) {
                        direction = [0, aspect[1]];
                    } else {
                        direction = [aspect[0], 0];
                    }
                }
            }

            x += direction[0];
            y += direction[1];
        }
        return path;
    }
    getLaserPath(laser) {
        if (laser == 0) {
            return this.getPath([9, 8], [0, -1]);
        } else if (laser == 1) {
            return this.getPath([0, -1], [0, 1]);
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
            this.aspect = [this.aspect[1], -this.aspect[0]];
        } else if (direction == 'R') {
            this.aspect = [-this.aspect[1], this.aspect[0]];
        }
    }
    copy() {
        return { ...this };
    }
    draw(ctx, x, y, rotation) {
        if (this.aspect) {
            rotation += getAngle(this.aspect[0], this.aspect[1]) + Math.PI / 4;
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
        return [['m', -1, 0],
                ['m', -1, 1],
                ['m', 0, 1],
                ['m', 1, 1],
                ['m', 1, 0],
                ['m', 1, -1],
                ['m', 0, -1],
                ['m', -1, -1]];
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
        return [['m', -1, 0],
                ['m', -1, 1],
                ['m', 0, 1],
                ['m', 1, 1],
                ['m', 1, 0],
                ['m', 1, -1],
                ['m', 0, -1],
                ['m', -1, -1]];
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
        return [['t', 'L'],
                ['t', 'R'],
                ['m', -1, 0],
                ['m', -1, 1],
                ['m', 0, 1],
                ['m', 1, 1],
                ['m', 1, 0],
                ['m', 1, -1],
                ['m', 0, -1],
                ['m', -1, -1]];
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
        return [['t', 'L'],
                ['t', 'R'],
                ['m', -1, 0],
                ['m', -1, 1],
                ['m', 0, 1],
                ['m', 1, 1],
                ['m', 1, 0],
                ['m', 1, -1],
                ['m', 0, -1],
                ['m', -1, -1]];
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

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }