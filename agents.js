class RandomAgent {
    getAction(boardState) {
        let moves = boardState.getValidMoves();
        let move = randomChoice(moves);
        let laser = randomChoice([0, 1, null]);
        return [move, laser];
    }
}


let savedWeights = new Counter();
savedWeights['Pyramids diff'] =	0.092308;
savedWeights['Defensive Pyramids'] = -0.042472;
savedWeights['Offensive Pyramids'] = 0.066060;
savedWeights['Reflectors on gold minus silver'] = 0.086882;
savedWeights['Defensive Djeds'] = 0.021674;
savedWeights['Offensive Djeds'] = 0.185774;
savedWeights['Laser control'] = 0.067372;
savedWeights['Laser near Pharaoh'] = -0.101078;
savedWeights['Spaces from Pharaoh'] = -0.166780;
savedWeights['Pyramids threatened'] = -0.022083;
savedWeights['Pharaohs threatened'] = -0.343031;
savedWeights['Teammates linking Pharaoh'] = 0.025879;
savedWeights['Teammates blocking Pharaoh'] = 0.108466;
savedWeights['Enemies linking Pharaoh'] = -0.086675;
savedWeights['Enemies blocking Pharaoh'] = -0.065223;


class MCSTAgent {
	constructor(featExtractor=new DeflexionExtractor(), discount=1, alpha=0.00, loadWeights=true) {
		this.featExtractor = featExtractor;
		this.discount = discount;
		this.alpha = alpha;
		if (loadWeights) {
			this.weights = savedWeights;
		} else {
			this.weights = Counter();
		}
	}
	getValue(boardState) {
		let result = boardState.isWinState();
		if (result == 'GOLD WINS!') {
			return 1;
		} else if (result == 'SILVER WINS!') {
			return -1;
		} else {
			let value = this.weights.dot(this.featExtractor.getFeatures(boardState));
			if (Math.abs(value) > 0.9) {
				return (value > 0 ? 0.9 : -0.9);
			} else {
				return value;
			}
		}
	}

	getAction(boardState, certainty=null, maxSimulations=10000) {
		let startTime = Date.now();
		let team = boardState.turn;
		let root = new MCSTNode(team, null, null, boardState);
		root.timesVisited = 1;
		root.averageValue = this.getValue(boardState);
		let simulations = 0;
		let finishedSimulations = 0;
		let duplicates = 0;
		// while time.time() - startTime < 10:
		while (simulations < maxSimulations) {
			simulations += 1;
			// Traverse
			let current = root;
			// console.log('root')
			while (!current.isLeaf()) {
				// current = max(current.children, key=lambda child: child.UCB())
				let bestUCB = -1;
				for (let child of current.children) {
					if (child.UCB > bestUCB) {
						var bestChild = child;
						if (child.UCB >= 1) {
							break;
						} else {
							bestUCB = child.UCB;
						}
					}
				}
				current = bestChild;

				// console.log(' ->', current.action)
			}
			if (current.timesVisited != 0 && !current.boardState.isWinState()) {
				// Add children
				current.makeChildren(this.getValue.bind(this));
				current = current.children[0];
				// console.log(' ->', current.action)
			}
			if (!current.isRoot() && !current.addBoardState()) {
				let index = current.parent.children.indexOf(current);
				current.parent.children.splice(index, 1);
				// console.log(': duplicate - cancelled')
				duplicates += 1;
				continue;
			}

			// Evaluate leaf
			let value = this.getValue(current.boardState);

			// Ignore suicides
			if (value == (current.teamToMove == 0 ? 1 : -1)) {
				let index = current.parent.children.indexOf(current);
				current.parent.children.splice(index, 1);
				// console.log(': self kill - cancelled')
				continue;
			}
			// Backpropagate
			// while current != null:
			while (!current.isRoot()) {
				current.update(value);
				current = current.parent;
			}
			finishedSimulations += 1;
		}

		if (certainty === null) {
			var chosenNode = root.children.reduce((a, b) => (a.timesVisited > b.timesVisited) ? a : b)
		} else {
			let teamToggle = (team == 0 ? 1 : -1);
			let probs = new Counter();
			for (let child of root.children) {
				if (child.timesVisited == 0) {
					continue;
				}
				let value = child.averageValue;
				probs[child] = 10**(teamToggle * certainty * value);
			}
			var chosenNode = probs.sample();
		}


		// Update weights
		let bestNode = root.children.reduce((a, b) => (a.timesVisited > b.timesVisited) ? a : b);
		let diff = (this.discount * bestNode.averageValue) - this.getValue(boardState);
		let features = this.featExtractor.getFeatures(boardState);
		for (let [key, activation] of Object.entries(features)) {
			this.weights[key] += this.alpha * diff * activation;
		}

		// print('Saving weights.p...');
		// try:
		// 	pickle.dump(this.weights, open("weights.p", "wb"));
		// except:
		// 	print('Save failed');


		console.log(simulations + ' simulations in ' + (Date.now() - startTime) / 1000 + ' seconds');
		console.log(finishedSimulations + ' finishedSimulations');
		console.log(duplicates + ' duplicates');
		// console.log('${root.children.length} children, avg ${finishedSimulations // len(root.children)} visitations');

		let mvc = root.children.reduce((a, b) => (a.timesVisited > b.timesVisited) ? a : b);
		console.log('most visited child:');
		console.log('  timesVisited = ' + mvc.timesVisited);
		console.log('  action = ' + mvc.action);
		console.log('  value = ' + mvc.averageValue);
		console.log('  teamToMove = ' + mvc.teamToMove);

		if (mvc.children.length > 0) {
			let mvg = mvc.children.reduce((a, b) => (a.timesVisited > b.timesVisited) ? a : b);
			console.log('most visited grandchild:');
			console.log('  timesVisited = ' + mvg.timesVisited);
			console.log('  action = ' + mvg.action);
			console.log('  value = ' + mvg.averageValue);
			console.log('  teamToMove = ' + mvg.teamToMove);
			console.log('  UCB = ' + mvg.UCB);
		}
		if (chosenNode.children.length > 0) {
			let wg = chosenNode.children.reduce((a, b) => (a.timesVisited > b.timesVisited) ? a : b);
			console.log('worse grandchild under chosen (' + chosenNode.timesVisited + ' visits):');
			console.log('  timesVisited = ' + wg.timesVisited);
			console.log('  action = ' + wg.action);
			console.log('  value = ' + wg.averageValue);
			console.log('  teamToMove = ' + wg.teamToMove);
			console.log('  UCB = ' + wg.UCB);
		}
		console.log('value chosen = ' + chosenNode.averageValue);

		return chosenNode.action;
	}
}