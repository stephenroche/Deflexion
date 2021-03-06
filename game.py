import util
import colorama
colorama.init()
from termcolor import colored
import sys
from agents import *
from featureExtractors import *
import cProfile

aspects = ['NE', 'SE', 'SW', 'NW']
opposite = {'N': 'S', 'E': 'W', 'S': 'N', 'W': 'E'}

class BoardState(dict):
	def __init__(self, turn=0):
		# dict.__init__()
		self.width = 10
		self.height = 8
		self.turn = turn
		self.num_turns = 0

	def __getitem__(self, key):
		return self.get(key, None)

	def set_start_state(self):
		self.clear()

		for team, position in [(0, (4, 0)), (1, (5, 7))]:
			self[position] = Pharaoh(team)

		for team, position in [(0, (3, 0)), (0, (5, 0)), (1, (4, 7)), (1, (6, 7))]:
			self[position] = Obelisk(team)

		for team, position, aspect in [(0, (2, 0), 'NW'), (0, (2, 3), 'NW'), (0, (2, 4), 'SW'), (0, (3, 5), 'NW'), (0, (7, 1), 'NE'), (0, (9, 3), 'SW'), (0, (9, 4), 'NW'), (1, (7, 7), 'SE'), (1, (7, 4), 'SE'), (1, (7, 3), 'NE'), (1, (6, 2), 'SE'), (1, (2, 6), 'SW'), (1, (0, 4), 'NE'), (1, (0, 3), 'SE')]:
			self[position] = Pyramid(team, aspect)

		for team, position, aspect in [(0, (4, 3), 'NW'), (0, (5, 3), 'NE'), (1, (4, 4), 'NE'), (1, (5, 4), 'NW')]:
			self[position] = Djed(team, aspect)

		self.turn = 0
		self.num_turns = 0

	def is_win_state(self):
		pharaohs_found = [False, False]

		for piece in self.values():
			if isinstance(piece, Pharaoh):
				pharaohs_found[piece.team] = True

		if pharaohs_found[0] and pharaohs_found[1]:
			return False

		elif pharaohs_found[0]:
			return 'Win_0'

		elif pharaohs_found[1]:
			return 'Win_1'

		else:
			sys.exit('Error: no pharaohs')

	def get_valid_moves(self):
		valid_moves = []
		for piece_pos, piece in self.items():
			if piece.team != self.turn:
				continue

			for action in piece.get_actions():
				next_x, next_y = piece_pos

				if action[0] == 'm':
					if 'N' in action:
						next_y += 1
					elif 'S' in action:
						next_y -= 1

					if 'E' in action:
						next_x += 1
					elif 'W' in action:
						next_x -= 1

					if (next_x, next_y) in self and not (isinstance(piece, Djed) and isinstance(self[next_x, next_y], (Pyramid, Obelisk)) and (piece_pos[0] != (self.width - 1) * (1 - piece.team))):
						continue

					if next_x < 0 or next_x	>= self.width or next_x == (self.width - 1) * piece.team:
						continue

					if next_y < 0 or next_y >= self.height:
						continue

				valid_moves.append( (piece_pos, action) )

		return valid_moves

	def make_move(self, move, check_valid=False):
		if check_valid and move not in self.get_valid_moves():
			print('Board before invalid move:')
			print(self)
			print('Invalid move: ' + str(move))
			return

		piece_pos, action = move
		piece = self[piece_pos]
		if action[0] == 't':
			piece.turn(action[1])

		elif action[0] == 'm':
			next_x, next_y = piece_pos

			if 'N' in action:
				next_y += 1
			elif 'S' in action:
				next_y -= 1

			if 'E' in action:
				next_x += 1
			elif 'W' in action:
				next_x -= 1

			swapped_piece = self[(next_x, next_y)] # Can be None
			self[(next_x, next_y)] = piece
			if swapped_piece:
				self[piece_pos] = swapped_piece
			else:
				del self[piece_pos]

		self.turn = 1 - self.turn
		self.num_turns += 1

	def copy(self):
		copied_board = BoardState(self.turn)
		for piece_pos, piece in self.items():
			copied_board[piece_pos] = piece.copy()

		return copied_board

	def get_successor_state(self, move=None, laser=None):
		next_board_state = self.copy()

		if move != None:
			next_board_state.make_move(move)

		if laser != None:
			next_board_state.fire_laser(laser)

		return next_board_state

	# # Maybe not use
	# def get_successor_states(self, opposition_team=False):
	# 	return [self.get_successor_state(move) for move in self.get_valid_moves(opposition_team=False)]

	def __str__(self):
		str_list = []

		str_list.append('\u250C\u2500')
		str_list.append(colored('\u2B07', 'red'))
		for _ in range(self.width * 2 - 1):
			str_list.append('\u2500')
		str_list.append('\u2510\n')

		for y in range(self.height - 1, -1, -1):
			str_list.append('\u2502 ')
			for x in range(self.width):
				if (x, y) in self:
					str_list.append(self[(x, y)].icon())
				elif x == 0:
					str_list.append(colored(' ', 'red', 'on_white'))
				elif x == self.width - 1:
					str_list.append(colored(' ', 'red', 'on_yellow'))
				else:
					str_list.append(' ')
				str_list.append(' ')
			str_list.append('\u2502\n')

		str_list.append('\u2514')
		for _ in range(self.width * 2 - 1):
			str_list.append('\u2500')
		str_list.append(colored('\u2B06', 'red'))
		str_list.append('\u2500\u2518\n')

		return ''.join(str_list)

	def get_path(self, start_pos, start_direction):
		path = []

		x, y = start_pos
		direction = start_direction

		while True:
			if not (0 <= x < self.width and 0 <= y < self.height):
				path.append(None)
				break

			path.append( (x, y) )

			if (x, y) not in self:
				if direction == 'N':
					y += 1
				elif direction == 'S':
					y -= 1
				elif direction == 'E':
					x += 1
				elif direction == 'W':
					x -= 1
				continue

			piece = self[(x, y)]

			if isinstance(piece, (Pharaoh, Obelisk)):
				break

			elif isinstance(piece, Pyramid):
				if direction in piece.aspect:
					break
				else:
					direction = piece.aspect.replace(opposite[direction], '')
					if direction == 'N':
						y += 1
					elif direction == 'S':
						y -= 1
					elif direction == 'E':
						x += 1
					elif direction == 'W':
						x -= 1

			elif isinstance(piece, Djed):
				aspect = piece.aspect
				if direction in aspect:
					aspect = ''.join(opposite[d] for d in aspect)

				direction = aspect.replace(opposite[direction], '')
				if direction == 'N':
					y += 1
				elif direction == 'S':
					y -= 1
				elif direction == 'E':
					x += 1
				elif direction == 'W':
					x -= 1
		return path

	def get_laser_path(self, laser):
		if laser == 0:
			return self.get_path((9, 0), 'N')
		elif laser == 1:
			return self.get_path((0, 7), 'S')

	def fire_laser(self, laser):
		hit_pos = self.get_laser_path(laser)[-1]
		if hit_pos:
			del self[hit_pos]
		return hit_pos

class Piece:
	def __init__(self, team, aspect=None):
		self.team = team
		self.aspect = aspect

	def get_actions(self):
		util.raiseNotDefined()

	def icon(self):
		util.raiseNotDefined()

	def __str__(self):
		return self.icon()

	def turn(self, direction):
		if direction == 'L':
			self.aspect = aspects[(aspects.index(self.aspect) + 3) % 4]
		elif direction == 'R':
			self.aspect = aspects[(aspects.index(self.aspect) + 1) % 4]

	def copy(self):
		return self.__class__(self.team, self.aspect)


class Pharaoh(Piece):
	"""docstring for Pharaoh"""
	def __init__(self, team, aspect=None):
		super().__init__(team, aspect)
		self.type = 'Pharaoh'

	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		return colored('\u265A', colour)


class Obelisk(Piece):
	"""docstring for Obelisk"""
	def __init__(self, team, aspect=None):
		super().__init__(team, aspect)
		self.type = 'Obelisk'

	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		return colored('\u25A3', colour)


class Pyramid(Piece):
	"""docstring for Pyramid"""
	def __init__(self, team, aspect=None):
		super().__init__(team, aspect)
		self.type = 'Pyramid'

	def get_actions(self):
		return ['tL', 'tR', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		characters = {'NE': '\u2B15', 'SE': '\u25E9', 'SW': '\u2B14', 'NW': '\u25EA'}

		return colored(characters[self.aspect], colour)


class Djed(Piece):
	"""docstring for Djed"""
	def __init__(self, team, aspect=None):
		super().__init__(team, aspect)
		self.type = 'Djed'

	def get_actions(self):
		if self.aspect == 'NE':
			return ['tL', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

		elif self.aspect == 'NW':
			return ['tR', 'mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		characters = {'NE': '\u29C5', 'NW': '\u29C4'}

		return colored(characters[self.aspect], colour)




# print(colored('\u265A \u26CB \U0001F796 \u25A9 \u2B1B', 'yellow'))

def run_games():
	extractor = DeflexionExtractor()
	random_agent = RandomAgent()
	keyboard_agent = KeyboardAgent()
	MCST_agent = MCSTAgent(alpha=0.001, load_weights=True)
	board = BoardState()
	num_games = 1
	for _ in range(1000):

		board.set_start_state()
		# board[(1, 5)] = Pharaoh(0)
		# board[(0, 6)] = Pyramid(1, 'NE')
		# board[(8, 7)] = Pharaoh(1)

		while board.num_turns < 100:
			print('-----------------')
			features = extractor.get_features(board)
			print('Features:', features)
			print('Weights:', MCST_agent.weights)
			print('Value: % .6f' % (MCST_agent.weights * features))
			print(board)

			if board.turn == 0:
				move, laser = keyboard_agent.get_action(board)
				# move, laser = random_agent.get_action(board)
			else:
				move, laser = MCST_agent.get_action(board, max_simulations=100000)#, certainty=10, max_simulations=10000)


			piece = board[move[0]]
			print(piece, move, laser)
			board.make_move(move, check_valid=True)

			if laser != None:
				board.fire_laser(laser)

			if board.is_win_state():
				break

			# input()

		# print(piece, move, laser)
		print(board)
		print(board.is_win_state(), '!!!')
		print(board.num_turns, 'turns')
		print('Game', num_games)
		num_games += 1
		print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

		# input()

# cProfile.run('run_games()', sort='time')
run_games()

# cProfile.run('''
# board = BoardState()
# board.set_start_state()
# for _ in range(1000):
# 	DeflexionExtractor().get_features(board)
# ''', sort='time')

# board = BoardState()
# board.set_start_state()
# agent = MCSTAgent()
# print(agent.get_action(board))