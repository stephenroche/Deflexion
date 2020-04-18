var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.width = 10;
        this.height = 8;
        this.canvas.width = 100 * (this.width + 1);
        this.canvas.height = 100 * (this.height + 1);
        this.ctx = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        //this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
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
        this.ctx.fillStyle = "#101010";
        this.ctx.arc(1, 0.25, 0.2, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.fillStyle = "#F00000";
        this.ctx.arc(1, 0.25, 0.01, 0, 2*Math.PI);
        this.ctx.fill();

        
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                this.ctx.translate(0.5 + i, 0.5 + j);
                this.ctx.fillStyle = "#A0A0A0";
                this.ctx.fillRect(0.05, 0.05, 0.95, 0.95);
                this.ctx.fillStyle = "#D0D0D0";
                this.ctx.fillRect(0.05, 0.05, 0.9, 0.9);
                this.ctx.translate(-(0.5 + i), -(0.5 + j));
            }
        }
        this.ctx.scale(1 / this.size, 1 / this.size)
    }
}

function updateGameArea() {
    gameArea.clear();
    gameArea.drawBackground();
}


function startGame() {              
    gameArea.start();
}
