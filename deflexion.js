"use strict";

const width = 10;
const height = 8;
// const rect = gameArea.canvas.getBoundingClientRect();

var gameArea = {
    canvas : document.getElementById("gameArea"),
    start : function() {
        this.canvas.width = 100 * (width + 1);
        this.canvas.height = 100 * (height + 1);
        this.ctx = this.canvas.getContext("2d");
        //this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
        this.buttons = [new Button(this.canvas.width - 100, this.canvas.height - 25), new Button(100, 25)];
        this.boardState = new BoardState();
        this.rect = this.canvas.getBoundingClientRect();
        this.canvas.addEventListener('mousedown', (e) => {
            this.x = e.x - this.rect.left;
            this.y = e.y - this.rect.top;
            this.clicked = true;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.x = e.x - this.rect.left;
            this.y = e.y - this.rect.top;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.x = false;
            this.y = false;
            this.clicked = false;
        });
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
        this.ctx.fillStyle = "#909090";
        this.ctx.fillRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);

        for (var i = 0; i < width; i++) {
            for (var j = 0; j < height; j++) {
                this.ctx.translate(50 + 100 * i, 50 + 100 * j);
                this.ctx.fillStyle = "#A0A0A0";
                this.ctx.fillRect(5, 5, 95, 95);
                this.ctx.fillStyle = "#D0D0D0";
                this.ctx.fillRect(5, 5, 90, 90);
                this.ctx.translate(-(50 + 100 * i), -(50 + 100 * j));
            }
        }
        this.ctx.scale(1 / this.size, 1 / this.size)
    },
    draw : function() {
        this.drawBackground();
        this.buttons[0].draw();
        this.buttons[1].draw();
        if (this.clicked) {
            this.ctx.fillStyle = "#00FF00";
            this.ctx.fillRect(this.x, this. y, 20, 20);
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
}

class BoardState {

    constructor() {
        this.pieces = new Map();
    }
}

function updateGameArea() {
    gameArea.clear();
    gameArea.draw();
}


function startGame() {              
    gameArea.start();
}
