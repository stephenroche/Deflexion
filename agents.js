class RandomAgent {
    getAction(boardState) {
        let moves = boardState.getValidMoves();
        let move = randomChoice(moves);
        let laser = randomChoice([0, 1, null]);
        return [move, laser];
    }
}



class MCSTAgent {
	constructor(featExtractor=DeflexionExtractor(), discount=1, alpha=0.01, loadWeights=false)) {
		this.featExtractor = featExtractor
		this.discount = discount
		this.alpha = alpha
		if loadWeights and path.isfile('./weights.p'):
			this.weights = pickle.load(open("weights.p", "rb"))
			print('Loaded weights from weights.p...')
		else:
			this.weights = Counter()
	}
	def getValue(this, boardState):
		result = boardState.isWinState()
		if result == 'Win_0':
			return 1
		elif result == 'Win_1':
			return -1
		else:
			value = this.weights * this.featExtractor.getFeatures(boardState)
			return sorted([-0.9, value, 0.9])[1]

	getAction(this, boardState, certainty=None, maxSimulations=100000):
		# this.weights.pop('Obelisks diff', None)
		# this.weights['Pharaohs threatened'] = -0.5

		startTime = time.time()
		team = boardState.turn
		root = MCSTNode(team, boardState=boardState)
		root.timesVisited = 1
		root.averageValue = this.getValue(boardState)
		simulations = 0
		finishedSimulations = 0
		duplicates = 0
		try:
			# while time.time() - startTime < 10:
			while simulations < maxSimulations:
				simulations += 1
				# Traverse
				current = root
				# print('root', end='')
				while not current.isLeaf():
					# current = max(current.children, key=lambda child: child.UCB())
					bestUCB = -1
					for child in current.children:
						if child.UCB > bestUCB:
							bestChild = child
							if child.UCB >= 1:
								break
							else:
								bestUCB = child.UCB
					current = bestChild

					# print(' ->', current.action, end='')

				if current.timesVisited != 0 and not current.boardState.isWinState():
					# Add children
					current.makeChildren(valueFunction=this.getValue)
					current = current.children[0]
					# print(' ->', current.action, end='')

				if not current.isRoot() and not current.addBoardState():
					current.parent.children.remove(current)
					# print(': duplicate - cancelled')
					duplicates += 1
					continue

				# print()

				# Evaluate leaf
				value = this.getValue(current.boardState)

				# Ignore suicides
				if value == (1 if current.teamToMove == 0 else -1):
					current.parent.children.remove(current)
					# print(': this kill - cancelled')
					continue

				# Backpropagate
				# while current != None:
				while not current.isRoot():
					current.update(value)
					current = current.parent

				finishedSimulations += 1

		except KeyboardInterrupt:
			pass

		if certainty == None:
			chosenNode = max(root.children, key=lambda child: child.timesVisited)

		else:
			teamToggle = 1 if team == 0 else -1
			probs = Counter()
			for child in root.children:
				if child.timesVisited == 0:
					continue
				value = child.averageValue
				probs[child] = 10**(teamToggle * certainty * value)
			chosenNode = probs.sample()



		# Update weights
		bestNode = max(root.children, key=lambda child: child.timesVisited)
		diff = (this.discount * bestNode.averageValue) - this.getValue(boardState)
		features = this.featExtractor.getFeatures(boardState)
		for key, activation in features.items():
			this.weights[key] += this.alpha * diff * activation

		print('Saving weights.p...')
		try:
			pickle.dump(this.weights, open("weights.p", "wb"))
		except:
			print('Save failed')


		print('%d simulations in %.3f seconds' % (simulations, time.time() - startTime))
		print(finishedSimulations, 'finishedSimulations')
		print(duplicates, 'duplicates')
		print('%d children, avg %d visitations' % (len(root.children), finishedSimulations // len(root.children)))

		mvc = max(root.children, key=lambda c: c.timesVisited)
		print('most visited child:')
		print('  timesVisited =', mvc.timesVisited)
		print('  action =', mvc.action)
		print('  value =', mvc.averageValue)
		print('  teamToMove =', mvc.teamToMove)

		if mvc.children:
			mvg = max(mvc.children, key=lambda c: c.timesVisited)
			print('most visited grandchild:')
			print('  timesVisited =', mvg.timesVisited)
			print('  action =', mvg.action)
			print('  value =', mvg.averageValue)
			print('  teamToMove =', mvg.teamToMove)
			print('  UCB =', mvg.UCB)

			# hvg = max(mvc.children, key=lambda c: -teamToggle * c.totalScore / c.timesVisited)
			# print('highest value grandchild:')
			# print('  timesVisited =', hvg.timesVisited)
			# print('  action =', hvg.action)
			# print('  value =', hvg.totalScore / hvg.timesVisited)
			# print('  teamToMove =', hvg.teamToMove)

		if chosenNode.children:
			wg = max(chosenNode.children, key=lambda c: c.timesVisited)
			print('worse grandchild under chosen (%d visits):' % chosenNode.timesVisited)
			print('  timesVisited =', wg.timesVisited)
			print('  action =', wg.action)
			print('  value =', wg.averageValue)
			print('  teamToMove =', wg.teamToMove)
			print('  UCB =', wg.UCB)

		print('value chosen =', chosenNode.averageValue)

		return chosenNode.action}
}