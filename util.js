function getAngle(x, y) {
    if (x >= 0) {
        return Math.atan(y / x);
    } else {
        return Math.atan(y / x) + Math.PI;
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}


class Counter {
  	constructor() {
  		return new Proxy(this, {
            get(target, name) {
				return (name in target) ? target[name] : 0;
			}
        });
  	}
  	dot(otherCounter) {
		let product = 0;
		for (let key in this) {
			product += this[key] * otherCounter[key];
		}
		return product;
	}
}


function manhattanDistance(xy1, xy2) {
    return Math.abs(xy1[0] - xy2[0]) + Math.abs(xy1[1] - xy2[1]);
}


class MCSTNode {
    constructor(teamToMove, parent=null, action=null, boardState=null) {
        this.teamToMove = teamToMove;
        this.parent = parent;
        this.children = [];
        this.action = action;
        this.boardState = boardState;
        this.timesVisited = 0;
        this.totalScore = 0;
        this.averageValue = null;
        this.UCB = 1;
        this.opponentActionValues = null;
    }
    isRoot() {
        return (this.parent == null);
    }
    isLeaf() {
        return (this.children.length == 0);
    }
    makeChildren(valueFunction) {
    	let actions = [];
    	let mapped = [];
    	if (!this.isRoot()) {
    		if (this.parent.opponentActionValues == null) {
	            this.parent.setOpponentActionValues(valueFunction);
	        }
	        for (let move of this.boardState.getValidMoves()) {
	            for (let laser of [null, 0, 1]) {
	            	let index = actions.length;
	            	let value;
	                actions.push([move, laser]);

			       	if ([move, laser] in this.parent.opponentActionValues) {
			            value = this.parent.opponentActionValues[ [move, laser] ];
			        } else if ([move, null] in this.parent.opponentActionValues) {
			            value = this.parent.opponentActionValues[ [move, null] ];
			        } else {
			            value = this.parent.averageValue;
			        }
			        mapped.push( {index: index, value: value} );
			    }
	        }
            
	        mapped.sort((a, b) => (a.value - b.value));
			actions = mapped.map(el => actions[el.index]);
        	if (this.teamToMove == 0) {
        		actions.reverse();
        	}
    	} else {
    		for (let move of this.boardState.getValidMoves()) {
	            for (let laser of [null, 0, 1]) {
	                actions.push([move, laser]);
			    }
	        }
    	}
		
		for (let action of actions) {
            this.children.push(new MCSTNode(1 - this.teamToMove, this, action));
        }
    }
    update(value) {
        this.timesVisited += 1;
        this.totalScore += value;
        this.averageValue = this.totalScore / this.timesVisited;

        let teamToggle = (this.teamToMove == 1 ? 1 : -1);
        this.UCB = teamToggle * this.averageValue + 1 / Math.sqrt(this.timesVisited + 1) * (1 - teamToggle * this.averageValue);
        // print('timesVisited:', this.timesVisited)
        // print('totalScore:', this.totalScore)
        // print('averageValue:', this.averageValue)
        // print('UCB set to', this.UCB)
    }
    addBoardState() {
        let [move, laser] = this.action;
        this.boardState = this.parent.boardState.getSuccessorState(move);

        if (this.boardState.fireLaser(laser) != false || laser == null) {
            return true;
        }

        return false;
    }
    setOpponentActionValues(valueFunction) {
        this.opponentActionValues = {};
        let boardStateReverseTurns = this.boardState.copy();
        boardStateReverseTurns.turn = 1 - boardStateReverseTurns.turn;
        for (let move of boardStateReverseTurns.getValidMoves()) {
            let nextBoardStatePreLaser = boardStateReverseTurns.getSuccessorState(move, false);
            for (let laser of [null, 0, 1]) {
                if (laser === null) {
                    var nextBoardState = nextBoardStatePreLaser;
                } else {
                	let path = nextBoardStatePreLaser.getLaserPath(laser);
                	let [endX, endY] = path[path.length - 1];
                	if (nextBoardStatePreLaser.contains(endX, endY)) {
                    	var nextBoardState = nextBoardStatePreLaser.getSuccessorState(false, laser);
	                } else {
	                    continue;
	                }
	            }
                this.opponentActionValues[ [move, laser] ] = valueFunction(nextBoardState);
            }
        }
    }
}