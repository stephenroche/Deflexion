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