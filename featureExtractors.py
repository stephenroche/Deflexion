import util
# from game import *
from math import sqrt

class FeatureExtractor:
    def get_features(self, board_state):
        """
          Returns a dict from features to counts
          Usually, the count will just be 1.0 for
          indicator functions.
        """
        util.raiseNotDefined()

class IdentityExtractor(FeatureExtractor):
    def get_features(self, board_state):
        feats = util.Counter()
        feats[board_state] = 1.0
        return feats

class DeflexionExtractor(FeatureExtractor):
    # Can add more complex ordering
    @staticmethod
    def pharaohs_first(item):
        piece_pos, piece = item

        return 0 if piece.type == 'Pharaoh' else 1

    @staticmethod
    def attenuate(activation):
        if activation >= 0:
            return sqrt(activation)
        else:
            return -sqrt(-activation)

    def get_features(self, board_state):
        feats = util.Counter()
        # feats['Gold\'s turn'] = 1 if board_state.turn == 0 else -1

        # Piece based:

        pharaoh_positions = [None, None]

        for piece_pos, piece in sorted(board_state.items(), key=self.pharaohs_first):
            team_toggle = 1 if piece.team == 0 else -1
            if piece.type == 'Pharaoh':
                pharaoh_positions[piece.team] = piece_pos
                continue

            # if piece.type == 'Obelisk':
            #     feats['Obelisks diff'] += team_toggle
            if piece.type == 'Pyramid':
                feats['Pyramids diff'] += team_toggle
                feats['Defensive Pyramids'] += 0.5 * team_toggle / (util.manhattanDistance(piece_pos, pharaoh_positions[piece.team]) + 1)
                feats['Offensive Pyramids'] += 0.5 * team_toggle / (util.manhattanDistance(piece_pos, pharaoh_positions[1 - piece.team]) + 1)
            elif piece.type == 'Djed':
                feats['Defensive Djeds'] += 0.5 * team_toggle / (util.manhattanDistance(piece_pos, pharaoh_positions[piece.team]) + 1)
                feats['Offensive Djeds'] += 0.5 * team_toggle / (util.manhattanDistance(piece_pos, pharaoh_positions[1 - piece.team]) + 1)

                # for x in (-1, 0, 1):
                #     for y in (-1, 0, 1):
                #         neighbour = board_state[(piece_pos[0] + x, piece_pos[1] + y)]
                #         if neighbour and neighbour.team != piece.team and neighbour.type in ('Obelisk', 'Pyramid'):
                #             feats['Enemies neighbouring Djeds'] += 0.1 * team_toggle


            if piece_pos[0] == board_state.width - 1 and piece.type in ('Pyramid', 'Djed') and 'S' in piece.aspect:
                feats['Refectors on gold minus silver'] += 1 / (abs(piece_pos[1] - pharaoh_positions[1][1]) + 2)
            elif piece_pos[0] == 0 and piece.type in ('Pyramid', 'Djed') and 'N' in piece.aspect:
                feats['Refectors on gold minus silver'] -= 1 / (abs(piece_pos[1] - pharaoh_positions[0][1]) + 2)

        # feats['Enemies neighbouring Djeds'] = self.attenuate(feats['Enemies neighbouring Djeds'])
        feats['Defensive Pyramids'] = self.attenuate(feats['Defensive Pyramids'])
        feats['Offensive Pyramids'] = self.attenuate(feats['Offensive Pyramids'])
        feats['Defensive Djeds'] = self.attenuate(feats['Defensive Djeds'])
        feats['Offensive Djeds'] = self.attenuate(feats['Offensive Djeds'])
        # feats['Refectors on gold minus silver'] = self.attenuate(feats['Refectors on gold minus silver'])

        # Path based:

        for laser in (0, 1):
            piece_from_laser = 1
            laser_path = board_state.get_laser_path(laser)
            dist_from_pharaoh_0 = 10
            dist_from_pharaoh_1 = 10
            for position in laser_path:
                if position != None:
                    dist_from_pharaoh_0 = min(dist_from_pharaoh_0, max(abs(position[0] - pharaoh_positions[0][0]), abs(position[1] - pharaoh_positions[0][1])))
                    dist_from_pharaoh_1 = min(dist_from_pharaoh_1, max(abs(position[0] - pharaoh_positions[1][0]), abs(position[1] - pharaoh_positions[1][1])))

                if position in board_state:
                    piece = board_state[position]
                    if position != laser_path[-1]:
                        feats['Laser control'] += 0.5 * (1 if piece.team == 0 else -1) / piece_from_laser
                        piece_from_laser += 1
                    else:
                        feats['%ss threatened' % piece.__class__.__name__] += 1 if piece.team == 0 else -1

        if dist_from_pharaoh_0 != 0 and dist_from_pharaoh_1 != 0:
            feats['Laser near Pharaoh'] = 2**(-dist_from_pharaoh_0) - 2**(-dist_from_pharaoh_1)

        # Paths from Pharaoh
        for team in (0, 1):
            x, y = pharaoh_positions[team]
            team_toggle = 1 if team == 0 else -1
            for start_pos, start_direction in [((x, y + 1), 'N'), ((x, y - 1), 'S'), ((x + 1, y), 'E'), ((x - 1, y), 'W')]:
                dist_from_pharaoh = 1
                path = board_state.get_path(start_pos, start_direction)
                for position in path[:-1]:
                    if position in board_state:
                        if board_state[position].team == team:
                            feats['Teammates linking Pharaoh'] += 0.2 * team_toggle
                        else:
                            feats['Enemies linking Pharaoh'] += 0.2 * team_toggle

                    else:
                        feats['Spaces from Pharaoh'] += 0.2 * team_toggle / dist_from_pharaoh

                    dist_from_pharaoh += 1
                if path[-1] != None:
                    if board_state[path[-1]].team == team:
                        feats['Teammates blocking Pharaoh'] += 0.2 * team_toggle
                    else:
                        feats['Enemies blocking Pharaoh'] += 0.2 * team_toggle

        feats.pop('Obelisks threatened', None)

        return feats

class SimpleExtractor(FeatureExtractor):
    """
    Returns simple features for a basic reflex Pacman:
    - whether food will be eaten
    - how far away the next food is
    - whether a ghost collision is imminent
    - whether a ghost is one step away
    """

    def get_features(self, board_state, action):
        # extract the grid of food and wall locations and get the ghost locations
        food = board_state.getFood()
        walls = board_state.getWalls()
        ghosts = board_state.getGhostPositions()

        features = util.Counter()

        features["bias"] = 1.0

        # compute the location of pacman after he takes the action
        x, y = board_state.getPacmanPosition()
        dx, dy = Actions.directionToVector(action)
        next_x, next_y = int(x + dx), int(y + dy)

        # count the number of ghosts 1-step away
        features["#-of-ghosts-1-step-away"] = sum((next_x, next_y) in Actions.getLegalNeighbors(g, walls) for g in ghosts)

        # if there is no danger of ghosts then add the food feature
        if not features["#-of-ghosts-1-step-away"] and food[next_x][next_y]:
            features["eats-food"] = 1.0

        dist = closestFood((next_x, next_y), food, walls)
        if dist is not None:
            # make the distance a number less than one otherwise the update
            # will diverge wildly
            features["closest-food"] = float(dist) / (walls.width * walls.height)
        features.divideAll(10.0)
        return features
