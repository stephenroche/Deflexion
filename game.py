import util
import colorama
colorama.init()
from termcolor import colored

aspects = ['NE', 'SE', 'SW', 'NW']
move_directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
laser_directions = ['N', 'E', 'S', 'W']

class BoardState(dict):
	def __init__(self):
		# dict.__init__()
		self.width = 10
		self.height = 8

	def __getitem__(self, key):
		return self.setdefault(key, None)

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
			return 'Error: no pharaohs'


	def get_successor_states(self):
		pass

	def __str__(self):
		str_list = []
		width = 10
		height = 8

		str_list.append('\u250C\u2500')
		str_list.append(colored('\u2B07', 'red'))
		for _ in range(width * 2 - 1):
			str_list.append('\u2500')
		str_list.append('\u2510\n')

		for y in range(height - 1, -1, -1):
			str_list.append('\u2502 ')
			for x in range(width):
				if (x, y) in self:
					str_list.append(self[(x, y)].icon())
				elif x == 0:
					str_list.append(colored(' ', 'red', 'on_white'))
				elif x == width - 1:
					str_list.append(colored(' ', 'red', 'on_yellow'))
				else:
					str_list.append(' ')
				str_list.append(' ')
			str_list.append('\u2502\n')

		str_list.append('\u2514')
		for _ in range(width * 2 - 1):
			str_list.append('\u2500')
		str_list.append(colored('\u2B06', 'red'))
		str_list.append('\u2500\u2518\n')

		return ''.join(str_list)

class Piece:
	def __init__(self, team, aspect=None):
		self.team = team
		self.aspect = aspect

	def get_actions(self):
		return util.raiseNotDefined()

	def icon(self):
		return util.raiseNotDefined()

	def __str__(self):
		return self.icon()

	# Maybe remove and put in BoardState
	def move(self, action):
		if action[0] == 'm':
			aspect = self.aspect

			if 'N' in action:
				y_step = 1
			elif 'S' in action:
				y_step = -1
			else:
				y_step = 0

			if 'E' in action:
				x_step = 1
			elif 'W' in action:
				x_step = -1
			else:
				x_step = 0

		elif action[0] == 't':
			x_step = y_step = 0

			if action[1] == L:
				aspect = aspects[(aspects.index(self.aspect) + 3) % 4]
			elif action[1] == R:
				aspect = aspects[(aspects.index(self.aspect) + 1) % 4]

		return ( (x_step, y_step), aspect)


class Pharaoh(Piece):
	"""docstring for Pharaoh"""
	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		return colored('\u265A', colour)


class Obelisk(Piece):
	"""docstring for Obelisk"""
	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		return colored('\u25A3', colour)


class Pyramid(Piece):
	"""docstring for Pyramid"""
	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tL', 'tR']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		characters = {'NE': '\u2B15', 'SE': '\u25E9', 'SW': '\u2B14', 'NW': '\u25EA'}

		return colored(characters[self.aspect], colour)


class Djed(Piece):
	"""docstring for Djed"""
	def get_actions(self):
		if self.aspect == 'NE':
			return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tL']

		elif self.aspect == 'NW':
			return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tR']

	def icon(self):
		colour = 'yellow' if self.team == 0 else 'white'
		characters = {'NE': '\u29C5', 'NW': '\u29C4'}

		return colored(characters[self.aspect], colour)




print(colored('\u25A3 \u25E9 \u25EA   \u25EA \u25EA \u25EA \u25EA\n\u2B14 \u2B15 \u29C4 \u29C5 \u265A \u26CB \U0001F796 \u25A9 \u2B1B', 'yellow'), colored('\u25E9', 'white'))

board = BoardState()
print(board)
board.set_start_state()
print(board)
print(board.is_win_state())
board[(1, 0)] = Pyramid(0, 'SW')
print(board)
board.set_start_state()
print(board)
del board[(4, 0)]
print(board)
print(board.is_win_state())