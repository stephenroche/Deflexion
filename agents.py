import random
import util
from featureExtractors import *

class Agent():
	"""docstring for Agent"""
	def get_action(self, board_state):
		util.raiseNotDefined()
	

class KeyboardAgent(Agent):
	"""docstring for KeyBoardAgent"""
	def get_action(self, board_state):
		x, y = input('Enter position: ').split()
		position = (int(x), int(y))
		action = input('Enter action: ')
		move = (position, action)
		laser = input('Choose laser: ')
		laser = None if laser == '' else int(laser)

		return (move, laser)
		

class RandomAgent(Agent):
	"""docstring for LearningAgent"""
	def get_action(self, board_state):
		moves = board_state.get_valid_moves()
		move = random.choice(moves)
		laser = 0 if util.flipCoin(0.5) else 1

		return (move, laser)
		

class LearningAgent(Agent):
	"""docstring for LearningAgent"""
	def __init__(self, arg):
		super(LearningAgent, self).__init__()
		self.arg = arg
		

class ApproximateQAgent(Agent):
    """
       ApproximateQLearningAgent

       You should only have to overwrite getQValue
       and update.  All other QLearningAgent functions
       should work as is.
    """
    def __init__(self, extractor='IdentityExtractor', **args):
        self.featExtractor = util.lookup(extractor, globals())()
        PacmanQAgent.__init__(self, **args)
        self.weights = util.Counter()

    def getWeights(self):
        return self.weights

    def getQValue(self, state, action):
        """
          Should return Q(state,action) = w * featureVector
          where * is the dotProduct operator
        """
        "*** YOUR CODE HERE ***"
        return self.weights * self.featExtractor.getFeatures(state, action)

    def update(self, state, action, nextState, reward):
        """
           Should update your weights based on transition
        """
        "*** YOUR CODE HERE ***"
        diff = (reward + self.discount * self.getValue(nextState)) - self.getQValue(state, action)
        features = self.featExtractor.getFeatures(state, action)
        for key in features:
            self.weights[key] += self.alpha * diff * features[key]

    def final(self, state):
        "Called at the end of each game."
        # call the super-class final method
        PacmanQAgent.final(self, state)

        # did we finish training?
        if self.episodesSoFar == self.numTraining:
            # you might want to print your weights here for debugging
            "*** YOUR CODE HERE ***"
            pass
