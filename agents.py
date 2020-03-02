import random
import util

class Agent():
	"""docstring for Agent"""
	def get_action(self, board_state):
		util.raiseNotDefined()
	

class KeyBoardAgent(Agent):
	"""docstring for KeyBoardAgent"""
	def __init__(self, arg):
		super(KeyBoardAgent, self).__init__()
		self.arg = arg
		

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
		
		