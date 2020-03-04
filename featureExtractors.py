import util
# from game import *

class FeatureExtractor:
    def getFeatures(self, board_state):
        """
          Returns a dict from features to counts
          Usually, the count will just be 1.0 for
          indicator functions.
        """
        util.raiseNotDefined()

class IdentityExtractor(FeatureExtractor):
    def getFeatures(self, board_state):
        feats = util.Counter()
        feats[board_state] = 1.0
        return feats

class DeflexionExtractor(FeatureExtractor):
    # Can add more complex ordering
    @staticmethod
    def pharaohs_first(item):
        piece_pos, piece = item

        return 0 if piece.type == 'Pharaoh' else 1

    def getFeatures(self, board_state):
        feats = util.Counter()
        feats['Gold\'s turn'] = 1 if board_state.turn == 0 else -1
        feats['Obelisks diff'] = 0
        feats['Pyramids diff'] = 0
        feats['Pieces on gold minus silver'] = 0
        feats['Defensive pieces'] = 0
        feats['Offensive pieces'] = 0
        feats['Enemies neighbouring Djeds'] = 0

        # Piece based:

        pharaoh_positions = [None, None]

        for piece_pos, piece in sorted(board_state.items(), key=self.pharaohs_first):
            team_toggle = 1 if piece.team == 0 else -1
            if piece.type == 'Pharaoh':
                pharaoh_positions[piece.team] = piece_pos
                continue

            if piece.type == 'Obelisk':
                feats['Obelisks diff'] += 0.1 * team_toggle
            elif piece.type == 'Pyramid':
                feats['Pyramids diff'] += 0.1 * team_toggle
            elif piece.type == 'Djed':
                for x in (-1, 0, 1):
                    for y in (-1, 0, 1):
                        neighbour = board_state[(piece_pos[0] + x, piece_pos[1] + y)]
                        if neighbour and neighbour.team != piece.team and neighbour.type in ('Obelisk', 'Pyramid'):
                            feats['Enemies neighbouring Djeds'] += 0.1 * team_toggle

            if piece_pos[0] == 0 or piece_pos[0] == board_state.width - 1:
                feats['Pieces on gold minus silver'] += 0.1 * team_toggle

            feats['Defensive pieces'] += 0.1 * team_toggle / util.manhattanDistance(piece_pos, pharaoh_positions[piece.team])
            feats['Offensive pieces'] += 0.1 * team_toggle / util.manhattanDistance(piece_pos, pharaoh_positions[1 - piece.team])

        # Path based:

        feats['Laser control'] = 0
        feats['Pieces threatened'] = 0
        for laser in (0, 1):
            piece_from_laser = 1
            laser_path = board_state.get_laser_path(laser)
            for position in laser_path:
                if position in board_state:
                    if position != laser_path[-1]:
                        feats['Laser control'] += 0.1 * (1 if board_state[position].team == 0 else -1) / piece_from_laser
                        piece_from_laser += 1
                    else:
                        feats['Pieces threatened'] += (1 if board_state[position].team == 0 else -1)

        # Paths from Pharaoh
        feats['Teammates from Pharaoh'] = 0
        feats['Enemies from Pharaoh'] = 0
        feats['Spaces from Pharaoh'] = 0
        for team in (0, 1):
            x, y = pharaoh_positions[team]
            team_toggle = 1 if team == 0 else -1
            for start_pos, start_direction in [((x, y + 1), 'N'), ((x, y - 1), 'S'), ((x + 1, y), 'E'), ((x - 1, y), 'W')]:
                dist_from_pharaoh = 1
                for position in board_state.get_path(start_pos, start_direction):
                    if position in board_state:
                        if board_state[position].team == team:
                            feats['Teammates from Pharaoh'] += 0.1 * team_toggle / dist_from_pharaoh
                        else:
                            feats['Enemies from Pharaoh'] += 0.1 * team_toggle / dist_from_pharaoh

                    else:
                        feats['Spaces from Pharaoh'] += 0.1 * team_toggle / dist_from_pharaoh

                    dist_from_pharaoh += 1

        return feats

class SimpleExtractor(FeatureExtractor):
    """
    Returns simple features for a basic reflex Pacman:
    - whether food will be eaten
    - how far away the next food is
    - whether a ghost collision is imminent
    - whether a ghost is one step away
    """

    def getFeatures(self, board_state, action):
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
