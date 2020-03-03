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

class TestExtractor(FeatureExtractor):
    # Can add more complex ordering
    @staticmethod
    def pharaohs_first(item):
        piece_pos, piece = item

        return 0 if isinstance(piece, Pharaoh) else 1

    def getFeatures(self, board_state):
        feats = util.Counter()
        feats['Obelisks diff'] = 0
        feats['Pyramids diff'] = 0
        feats['Djeds diff'] = 0
        feats['Pieces on gold minus silver'] = 0
        feats['Defensive pieces'] = 0
        feats['Offensive pieces'] = 0

        pharaoh_positions = [None, None]

        for piece_pos, piece in sorted(board_state.items(), key=self.pharaohs_first):
            team_toggle = 1 if piece.team == 0 else -1
            if isinstance(piece, Pharaoh):
                pharaoh_positions[piece.team] = piece_pos
                continue

            if isinstance(piece, Obelisk):
                feats['Obelisks diff'] += 0.1 * team_toggle
            elif isinstance(piece, Pyramid):
                feats['Pyramids diff'] += 0.1 * team_toggle
            elif isinstance(piece, Djed):
                feats['Djeds diff'] += 0.1 * team_toggle

            if piece_pos[0] == 0 or piece_pos[0] == board_state.width - 1:
                feats['Pieces on gold minus silver'] += 0.1 * team_toggle

            feats['Defensive pieces'] += 0.1 * team_toggle / util.manhattanDistance(piece_pos, pharaoh_positions[piece.team])
            feats['Offensive pieces'] += 0.1 * team_toggle / util.manhattanDistance(piece_pos, pharaoh_positions[1 - piece.team])

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
