import random
import util

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
		
		