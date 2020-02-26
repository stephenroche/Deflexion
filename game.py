import util

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

    # def add_piece(self, piece, position):
    # 	self[position] = piece

    def set_start_state(self):
    	# Check these positions
    	self[(4, 0)] = Pharaoh(0)
    	self[(5, 7)] = Pharaoh(1)

    	for team, position in [(0, (3, 0)), (0, (5, 0)), (1, (4, 7)), (1, (6, 7))]:
    		self[position] = Obelisk(team)

    	for team, position, aspect in []:
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

class Piece:
	def __init__(self, team, aspect='NE'):
		self.team = team
		self.aspect = aspect

	def get_actions(self):
		return util.raiseNotDefined()

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

		elif action[0] == 't'
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


class Obelisk(Piece):
	"""docstring for Obelisk"""
	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW']


class Pyramid(Piece):
	"""docstring for Pyramid"""
	def get_actions(self):
		return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tL', 'tR']


class Djed(Piece):
	"""docstring for Djed"""
	def get_actions(self):
		if self.aspect == 'NE':
			return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tL']

		elif self.aspect == 'NW':
			return ['mN', 'mNE', 'mE', 'mSE', 'mS', 'mSW', 'mW', 'mNW', 'tR']
