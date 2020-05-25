'use strict';

const WIDTH = 10;
const HEIGHT = 8;
const GOLD_PIECE = '#FFF000';
const DARK_GOLD_PIECE = '#BBB000';
const SILVER_PIECE = '#F0F0F0';
const DARK_SILVER_PIECE = '#B0B0B0';
// const BACKGROUND = '#A0A0A0';

function startGame() {              
    gameArea.start();
}

var gameArea = {
    canvas : document.getElementById('board-area'),
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
    get grabbedPieceMove() {
        if (this.grabbedAngle) {
            let turnedAngle = (this.turnedAngle + 2 * Math.PI) % (2 * Math.PI);
            if (0.25 * Math.PI < turnedAngle && turnedAngle < 0.75 * Math.PI) {
                return [this.grabbedPiece, ['t', 'R']];
            } else if (1.25 * Math.PI < turnedAngle && turnedAngle < 1.75 * Math.PI) {
                return [this.grabbedPiece, ['t', 'L']];
            } else {
                return [this.grabbedPiece, ['t', 'X']];
            }
        } else {
            return [this.grabbedPiece, ['m', this.hoverSquare[0] - this.grabbedPiece[0], this.hoverSquare[1] - this.grabbedPiece[1]]];
        }
    },
    start : function() {
        this.canvas.width = 100 * (WIDTH + 1);
        this.canvas.height = 100 * (HEIGHT + 1);
        this.ctx = this.canvas.getContext('2d');
        //this.frameNo = 0;
        this.interval = setInterval(this.update.bind(this), 50);
        this.buttons = [new Button(this.canvas.width - 100, this.canvas.height - 25), new Button(100, 25)];
        this.boardState = new BoardState();

        this.boardState.setStartState();
        // this.boardState[1][7] = new Pharaoh(0);
        // this.boardState[8][5] = new Pharaoh(1);
        // // this.boardState[9][6] = new Pyramid(0, [-1, 1]);
        // this.boardState[9][5] = new Pyramid(0, [-1, 1]);

        // console.log(this.boardState.getValidMoves());
        this.laserPath = [];
        this.opposition = new MCSTAgent();
        this.boardHistory = [this.boardState.copy()];
        this.turnDisplayed = 0;

        // this.canvas.addEventListener('mouseover', (e) => {
        //     this.pixelX = e.x - this.rect.left;
        //     this.pixelY = e.y - this.rect.top;
        // });

        this.canvas.addEventListener('mousedown', (e) => {
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].isHover(this.pixelX, this.pixelY)) {
                    this.fireLaser(i);
                    return;
                }
            }
            if (this.isWinState) {
                return;
            }
            let [squareX, squareY] = this.pixelToSquare(this.pixelX, this.pixelY);
            if (this.boardState[squareX][squareY]) {
                if (this.boardState.moveMade || this.boardState[squareX][squareY].team != this.boardState.turn) {
                    return;
                }
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
            let rect = this.canvas.getBoundingClientRect();
            this.pixelX = e.offsetX * 100 * (WIDTH + 1) / rect.width;
            this.pixelY = e.offsetY * 100 * (HEIGHT + 1) / rect.height;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.laserInterval) {
                this.stopLaser();
            }
            if (this.grabbedPiece) {
                this.dropPiece();
            }
        });
        this.canvas.addEventListener('mouseleave', (e) => {
            delete this.pixelX;
            delete this.pixelY;
        });
    },
    stop : function() {
        clearInterval(this.interval);
    },    
    clear : function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawBackground : function() {
        this.ctx.fillStyle = '#303030';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#606060';
        this.ctx.fillRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);

        for (var i = 0; i < WIDTH; i++) {
            for (var j = 0; j < HEIGHT; j++) {
                this.ctx.translate(50 + 100 * i, 50 + 100 * j);
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(5, 5, 95, 95);
                if (i == 0) {
                    this.ctx.fillStyle = '#F0F0F0';
                } else if (i == WIDTH - 1) {
                    this.ctx.fillStyle = '#F0D070';
                } else{
                    this.ctx.fillStyle = '#A0A0A0';
                }
                this.ctx.fillRect(5, 5, 90, 90);
                this.ctx.translate(-(50 + 100 * i), -(50 + 100 * j));
            }
        }
        this.ctx.scale(1 / this.size, 1 / this.size)
    },
    update : function() {
        this.clear();
        this.ctx.lineJoin = 'miter';
        this.drawBackground();
        this.buttons[0].draw();
        this.buttons[1].draw();
        this.ctx.lineJoin = 'bevel';
        this.drawPieces();
        this.drawLaser();
        this.drawGameOver();
    },
    drawPieces : function() {
        if (this.grabbedPiece) {
            var [grabbedPieceX, grabbedPieceY] = this.grabbedPiece;
        }
        // console.log(this.boardState);
        for (let [pos, piece] of this.boardState) {
            let [x, y] = pos;
            if (this.grabbedPiece && x === grabbedPieceX && y === grabbedPieceY) {
                continue;
            }
            // console.log(piece);
            piece.draw(this.ctx, 100 * (x + 1), 100 * (y + 1), 0);
        }
        if (this.grabbedPiece) {
            let piece = this.boardState[grabbedPieceX][grabbedPieceY];
            let drawX = 100 * (grabbedPieceX + 1);
            let drawY = 100 * (grabbedPieceY + 1);
            let rotation = 0;
            if (this.grabbedAngle) {
                this.drawGlowTurn();
                rotation += this.turnedAngle;
            } else {
                this.drawGlowMove();
                drawX += this.pixelX - this.grabbedPixelX;
                drawY += this.pixelY - this.grabbedPixelY;
            }
            
            piece.draw(this.ctx, drawX, drawY, rotation);
        } else if (this.pixelX) {
            this.drawSwivel();
        }

    },
    drawGlowMove : function() {
        for (let [pos, action] of this.boardState.getValidMoves()) {
            if (JSON.stringify(pos) == JSON.stringify(this.grabbedPiece) && action[0] == 'm') {
                let [glowX, glowY] = this.grabbedPiece;
                glowX += action[1];
                glowY += action[2];
                this.ctx.beginPath();
                if (JSON.stringify([glowX, glowY]) == JSON.stringify(this.hoverSquare)){
                    this.ctx.strokeStyle = 'hsla(0, 100%, 50%, 0.5)';
                } else {
                    this.ctx.strokeStyle = 'hsla(120, 100%, 50%, 0.5)';
                }
                this.ctx.lineWidth = 10;
                this.ctx.strokeRect(100 * (glowX + 1) - 45, 100 * (glowY + 1) - 45, 90, 90);
            }
        }
    },
    drawGlowTurn : function() {
        if (['L', 'R'].includes(this.grabbedPieceMove[1][1])) {
            let [glowX, glowY] = this.grabbedPiece;
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'hsla(0, 100%, 50%, 0.5)';
            this.ctx.lineWidth = 10;
            this.ctx.strokeRect(100 * (glowX + 1) - 45, 100 * (glowY + 1) - 45, 90, 90);
        }
    },
    drawSwivel : function() {
        let [x, y] = this.pixelToSquare(this.pixelX, this.pixelY);
        if (this.boardState.contains(x, y) && !this.boardState.moveMade && this.boardState[x][y].team == this.boardState.turn && ['Pyramid', 'Djed'].includes(this.boardState[x][y].type)) {
            this.ctx.lineWidth = 4;
            // this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = 'hsla(0, 0%, 40%, 0.7)';
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
        if (laser !== null) {
            let fullPath = this.boardState.getLaserPath(laser);
            let len = fullPath.length;
            let [x1, y1] = fullPath[0];
            let [x2, y2] = fullPath[1];
            fullPath[0] = [(x1 + x2) / 2, (y1 + y2) / 2];
            // [x1, y1] = fullPath[len - 3];
            // [x2, y2] = fullPath[len - 2];
            // if (fullPath[len - 1] == 'hit') {
            [x1, y1] = fullPath[len - 2];
            [x2, y2] = fullPath[len - 1];
            if (this.boardState.contains(x2, y2)) {
                this.pieceHit = [...fullPath[len - 1]];
                fullPath[len - 1] = [0.3 * x1 + 0.7 * x2, 0.3 * y1 + 0.7 * y2];
            } else {
                fullPath[len - 1] = [0.5 * x1 + 0.5 * x2, 0.5 * y1 + 0.5 * y2];
            }
            // fullPath.pop();
            // len--;

            this.laserPath = [];
            this.laserInterval = setInterval(() => {
                let drawnLength = this.laserPath.length;
                if (drawnLength != len) {
                    this.laserPath.push(fullPath[drawnLength]);
                }
            }, 50);
        }
    },
    stopLaser : function() {
        clearInterval(this.laserInterval);
        delete this.laserInterval;
        this.laserPath = [];
        if (this.boardState.moveMade) {
            this.boardState.turn = 1 - this.boardState.turn;
            // this.boardState.numTurns += 1;
            this.boardState.moveMade = false;
            if (this.pieceHit) {
                let [x, y] = this.pieceHit;
                delete this.boardState[x][y];
            }
            this.turnDisplayed++;
            this.boardHistory = this.boardHistory.slice(0, this.turnDisplayed);
            this.boardHistory.push(this.boardState.copy());
            // console.log(this.boardHistory);
            this.isWinState = this.boardState.isWinState();
            if (this.boardState.turn == 1 && this.opposition && !this.isWinState) {
                this.makeOppositionMove();
            }
        }
        delete this.pieceHit;
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
        this.ctx.stroke();
    },
    pixelToSquare : function(pixelX, pixelY) {
        let squareX = Math.round(pixelX / 100) - 1;
        let squareY = Math.round(pixelY / 100) - 1;
        return [squareX, squareY];
    },
    dropPiece : function() {
        this.boardState.makeMove(this.grabbedPieceMove);
        delete this.grabbedPiece;
        delete this.grabbedPixelX;
        delete this.grabbedPixelY;
        delete this.grabbedAngle;
    },
    makeOppositionMove : async function() {
        this.update();
        await sleep(500);
        let [move, laser] = this.opposition.getAction(this.boardState.copy());
        this.boardState.makeMove(move);
        if (laser !== null) {
            await sleep(1000);
            this.fireLaser(laser);
            await sleep(2000);
        }
        this.stopLaser();
    },
    undo : function() {
        if (this.boardState.moveMade) {
            this.boardState = this.boardHistory[this.turnDisplayed].copy();
        } else if (this.turnDisplayed > 0) {
            this.turnDisplayed--;
            this.boardState = this.boardHistory[this.turnDisplayed].copy();
            // console.log(this.boardHistory);
            this.isWinState = false;
        }
    },
    redo : function() {
        if (this.turnDisplayed < this.boardHistory.length - 1) {
            this.turnDisplayed++;
            this.boardState = this.boardHistory[this.turnDisplayed].copy();
            // console.log(this.boardHistory);
            this.isWinState = this.boardState.isWinState();
        }
    },
    drawGameOver : function() {
        if (this.isWinState) {
            this.ctx.fillStyle = 'hsla(0, 100%, 50%, 0.7)';
            this.ctx.font = "150px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.isWinState, 550, 500);
        }
    }
}


function Button(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.draw = function() {
        var ctx = gameArea.ctx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        if (this.isHover(gameArea.pixelX, gameArea.pixelY)) {
            ctx.fillStyle = '#F06060';
        } else {
            ctx.fillStyle = '#F00000';
        }
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    this.isHover = function(pixelX, pixelY) {
        var distance = Math.sqrt((pixelX - this.x)**2 + (pixelY - this.y)**2);
        return (distance <= this.radius);
    }
}


class BoardState extends Array {
    constructor(turn=0) {
        super();
        this.clear()
        this.turn = turn;
        // this.numTurns = 0;
        this.moveMade = false;
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
        // this.numTurns = 0;
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
            return 'GOLD WINS!';
        } else if (pharaohsFound[1]) {
            return 'SILVER WINS!';
        } else {
            alert('Error: no pharaohs');
            return 'Error';
        }
    }
    getValidMoves() {
        let validMoves = [];
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
                validMoves.push([piecePos, action]);
            }
        }
        return validMoves;
    }
    makeMove(move) {
        if (this.moveMade || !this.containsMove(this.getValidMoves(), move)) {
            // alert('Invalid move: ' + move);
            return;
        }


        let [[oldX, oldY], action] = move;
        if (action[0] == 't') {
            this[oldX][oldY].turn(action[1]);
        } else if (action[0] == 'm') {
            let newX = oldX + action[1];
            let newY = oldY + action[2];
            if (this[newX][newY]) {
                let swappedPiece = this[newX][newY]
                this[newX][newY] = this[oldX][oldY];
                this[oldX][oldY] = swappedPiece;
            } else {
                this[newX][newY] = this[oldX][oldY];
                delete this[oldX][oldY];
            }
        }
        this.moveMade = true;
    }
    containsMove(array, move) {
        let [[x1, y1], action1] = move;
        for (let [[x2, y2], action2] of array) {
            if (x1 === x2 && y1 === y2 && action1[1] === action2[1] && (action1[0] === 't' || action1[2] === action2[2])) {
                return true;
            }
        }
        return false;
    }
    copy() {
        let copiedBoard = new BoardState(this.turn);
        for (const [[x, y], piece] of this) {
            copiedBoard[x][y] = piece.copy();
        }

        return copiedBoard;
    }
    contains(x, y) {
        return (this[x] && this[x][y]);
    }
    getSuccessorState(move=false, laser=false) {
        let nextBoardState = this.copy();
        if (move !== false) {
            nextBoardState.makeMove(move);
        }
        if (laser !== false) {
            nextBoardState.fireLaser(laser);
        }
        return nextBoardState;
    }
    getPath(startPos, startDirection) {
        var path = [];
        var [x, y] = startPos;
        var direction = startDirection;
        while (true) {
            path.push([x, y]);
            if (path.length > 1 && (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)) {
                // path.push('safe');
                break;
            }

            if (this[x][y]) {
                var piece = this[x][y];

                if (['Pharaoh', 'Obelisk'].includes(piece.type)) {
                    // path.push('hit');
                    break;
                } else if (piece.type == 'Pyramid') {
                    if (piece.aspect[0] * direction[0] + piece.aspect[1] * direction[1] == 1) {
                        // path.push('hit');
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
    fireLaser(laser) {
        this.moveMade = false;
        this.turn = 1 - this.turn;
        if (laser === null) {
            return false;
        }
        let path = this.getLaserPath(laser);
        let [endX, endY] = path[path.length - 1];
        if (this.contains(endX, endY)) {
            delete this[endX][endY];
            return [endX, endY];
        } else {
            return false;
        }
    }
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
        return new this.constructor(this.team, this.aspect);
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
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-49, -49, 98, 98);
    }
}


class Pharaoh extends Piece {
    constructor(team, aspect=null) {
        super(team, aspect);
        this.type = 'Pharaoh';
    }
    getActions() {
        return [['m', 0, -1],
                ['m', 1, -1],
                ['m', 1, 0],
                ['m', 1, 1],
                ['m', 0, 1],
                ['m', -1, 1],
                ['m', -1, 0],
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
        return [['m', 0, -1],
                ['m', 1, -1],
                ['m', 1, 0],
                ['m', 1, 1],
                ['m', 0, 1],
                ['m', -1, 1],
                ['m', -1, 0],
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
                ['m', 0, -1],
                ['m', 1, -1],
                ['m', 1, 0],
                ['m', 1, 1],
                ['m', 0, 1],
                ['m', -1, 1],
                ['m', -1, 0],
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
        ctx.moveTo(-45, -45);
        ctx.lineTo(45, 45);
        ctx.lineTo(-45, 45);
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
                ['m', 0, -1],
                ['m', 1, -1],
                ['m', 1, 0],
                ['m', 1, 1],
                ['m', 0, 1],
                ['m', -1, 1],
                ['m', -1, 0],
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


let slider = document.getElementById("difficulty-slider");
let output = document.getElementById("difficulty-number");
output.innerHTML = slider.value;

slider.oninput = function() {
    output.innerHTML = this.value;
}