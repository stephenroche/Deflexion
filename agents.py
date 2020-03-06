import random
import util
from featureExtractors import *
from copy import deepcopy
from math import log10

class Agent():
	"""docstring for Agent"""
	def get_action(self, board_state, team=0):
		util.raiseNotDefined()
	

class KeyboardAgent(Agent):
	"""docstring for KeyBoardAgent"""
	def get_action(self, board_state, team=0):
		x, y = input('Enter position: ').split()
		position = (int(x), int(y))
		action = input('Enter action: ')
		move = (position, action)
		laser = input('Choose laser: ')
		laser = None if laser == '' else int(laser)

		return (move, laser)
		

class RandomAgent(Agent):
	"""docstring for LearningAgent"""
	def get_action(self, board_state, team=0):
		moves = board_state.get_valid_moves()
		move = random.choice(moves)
		laser = 0 if random.random() < 0.5 else 1

		return (move, laser)
		

class LearningAgent(Agent):
	"""docstring for LearningAgent"""
	def __init__(self, feat_extractor=DeflexionExtractor(), discount=1, alpha=0.01):
		self.weights = util.Counter()
		self.feat_extractor = feat_extractor
		self.discount = discount
		self.alpha = alpha

	def get_value(self, board_state):
		result = board_state.is_win_state()
		if result == 'Win_0':
			return 1
		elif result == 'Win_1':
			return -1
		else:
			return self.weights * self.feat_extractor.get_features(board_state)

	def get_action(self, board_state, team, epsilon=0, certainty=10):
		team_toggle = 1 if team == 0 else -1
		moves = board_state.get_valid_moves()
		probs = util.Counter()

		best_action = None
		best_value = None
		for move in moves:
			board_state_after_move = board_state.get_successor_state(move=move)

			for laser in (None, 0, 1):
				if laser == None:
					board_state_after_laser = board_state_after_move
				elif board_state_after_move.get_laser_path(laser)[-1] != None:
					board_state_after_laser = board_state_after_move.get_successor_state(laser=laser)
				else:
					continue

				value = self.get_value(board_state_after_laser)
				probs[(move, laser)] = 10**(team_toggle * certainty * value)

				if not best_action or team_toggle * value > team_toggle * best_value:
					best_action = (move, laser)
					best_value = value

		print('Best move was', best_action, 'with value', best_value)

		action = probs.sample()
		value = log10(probs[action]) / (team_toggle * certainty)

		print('Move taken was', action, 'with value', value)

		# Update weights
		diff = (self.discount * value) - self.get_value(board_state)
		features = self.feat_extractor.get_features(board_state)
		for key, activation in features.items():
			self.weights[key] += self.alpha * diff * activation * (2 if best_value in (1, -1) else 1)

		# if random.random() < epsilon:
		# 	move = random.choice(moves)
		# 	laser = random.choice( (None, 0, 1) )

		# 	print('Best move was', best_action, 'with value', best_value)

		# 	return (move, laser)

		# else:
		# 	return best_action

		return action
		
		

# class ApproximateQAgent(Agent):
#     """
#        ApproximateQLearningAgent

#        You should only have to overwrite getQValue
#        and update.  All other QLearningAgent functions
#        should work as is.
#     """
#     def __init__(self, extractor='IdentityExtractor', **args):
#         self.featExtractor = util.lookup(extractor, globals())()
#         PacmanQAgent.__init__(self, **args)
#         self.weights = util.Counter()

#     def getWeights(self):
#         return self.weights

#     def getQValue(self, state, action):
#         """
#           Should return Q(state,action) = w * featureVector
#           where * is the dotProduct operator
#         """
#         "*** YOUR CODE HERE ***"
#         return self.weights * self.featExtractor.getFeatures(state, action)

#     def update(self, state, action, nextState, reward):
#         """
#            Should update your weights based on transition
#         """
#         "*** YOUR CODE HERE ***"
#         diff = (reward + self.discount * self.getValue(nextState)) - self.getQValue(state, action)
#         features = self.featExtractor.getFeatures(state, action)
#         for key in features:
#             self.weights[key] += self.alpha * diff * features[key]

#     def final(self, state):
#         "Called at the end of each game."
#         # call the super-class final method
#         PacmanQAgent.final(self, state)

#         # did we finish training?
#         if self.episodesSoFar == self.numTraining:
#             # you might want to print your weights here for debugging
#             "*** YOUR CODE HERE ***"
#             pass
