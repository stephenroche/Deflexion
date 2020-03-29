import random
import util
from featureExtractors import *
from copy import deepcopy
from math import log10, inf
import time

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

		action = probs.sample()
		value = log10(probs[action]) / (team_toggle * certainty)

		print('Best move was', best_action, 'with value', best_value)
		print('Move taken was', action, 'with value', value)

		# Update weights
		diff = (self.discount * value) - self.get_value(board_state)
		features = self.feat_extractor.get_features(board_state)
		for key, activation in features.items():
			self.weights[key] += self.alpha * diff * activation #* (10 if value == 1 else 1)

		# if random.random() < epsilon:
		# 	move = random.choice(moves)
		# 	laser = random.choice( (None, 0, 1) )

		# 	print('Best move was', best_action, 'with value', best_value)

		# 	return (move, laser)

		# else:
		# 	return best_action

		return action
		
		

class MCSTAgent(LearningAgent):
	def get_action(self, board_state, team, certainty=10):
		start_time = time.time()
		root = util.MCST_Node(team, board_state=board_state)
		# root.times_visited = 1
		simulations = 0
		finished_simulations = 0
		duplicates = 0
		# while time.time() - start_time < 10:
		while simulations < 10000:
			simulations += 1
			# Traverse
			current = root
			# print('root', end='')
			while not current.is_leaf():
				# current = max(current.children, key=lambda child: child.UCB())
				best_UCB = -inf
				for child in current.children:
					UCB = child.UCB()
					if UCB > best_UCB:
						best_child = child
						if UCB >= 1:
							break
						else:
							best_UCB = UCB
				current = best_child

				# print(' ->', current.action, end='')

			if current.times_visited != 0 and not current.board_state.is_win_state():
				# Add children
				current.make_children()
				current = current.children[0]
				# print(' ->', current.action, end='')

			if not current.is_root() and not current.add_board_state():
				current.parent.children.remove(current)
				# print(': duplicate - cancelled')
				duplicates += 1
				continue

			# print()

			# Evaluate leaf
			value = self.get_value(current.board_state)

			# Ignore suicides
			if value == (1 if current.team_to_move == 0 else -1):
				current.parent.children.remove(current)
				# print(': self kill - cancelled')
				continue

			# Backpropagate
			while current != None:
				current.times_visited += 1
				current.total_score += value
				current = current.parent

			finished_simulations += 1


		team_toggle = 1 if team == 0 else -1
		probs = util.Counter()
		for child in root.children:
			value = child.total_score / child.times_visited
			probs[child.action] = 10**(team_toggle * certainty * value)
		action = probs.sample()
		value = log10(probs[action]) / (team_toggle * certainty)



		# chosen_node = max(root.children, key=lambda child: child.times_visited)

		# Update weights
		# value = chosen_node.total_score / chosen_node.times_visited
		diff = (self.discount * value) - self.get_value(board_state)
		features = self.feat_extractor.get_features(board_state)
		for key, activation in features.items():
			self.weights[key] += self.alpha * diff * activation #* (10 if value == 1 else 1)

		# self.weights['Pyramids diff'] = 100

		print(simulations, 'simulations')
		print(finished_simulations, 'finished_simulations')
		print(duplicates, 'duplicates')
		print('%d children, avg %d visitations' % (len(root.children), simulations // len(root.children)))

		mvc = max(root.children, key=lambda c: c.times_visited)
		print('most visited child:')
		print('  times_visited =', mvc.times_visited)
		print('  action =', mvc.action)
		print('  value =', mvc.total_score / mvc.times_visited)
		print('  team_to_move =', mvc.team_to_move)

		if mvc.children != []:
			mvg = max(mvc.children, key=lambda c: c.times_visited)
			print('most visited grandchild:')
			print('  times_visited =', mvg.times_visited)
			print('  action =', mvg.action)
			print('  value =', mvg.total_score / mvg.times_visited)
			print('  team_to_move =', mvg.team_to_move)

			# hvg = max(mvc.children, key=lambda c: -team_toggle * c.total_score / c.times_visited)
			# print('highest value grandchild:')
			# print('  times_visited =', hvg.times_visited)
			# print('  action =', hvg.action)
			# print('  value =', hvg.total_score / hvg.times_visited)
			# print('  team_to_move =', hvg.team_to_move)

		print('value chosen =', value)

		# return chosen_node.action
		return action