class DeflexionExtractor {
    // Can add more complex ordering
    pharaohsFirst(a, b) {
        return (b[1].type == 'Pharaoh') - (a[1].type == 'Pharaoh');
    }
    attenuate(activation) {
        if (activation >= 0) {
            return Math.sqrt(activation);
        } else {
            return -Math.sqrt(-activation);
        }
    }
    getFeatures(boardState) {
        let feats = new Counter();

        // Piece based:

        pharaohPositions = [null, null];

        for piecePos, piece in boardState.items().sort(key=self.pharaohsFirst):
            teamToggle = 1 if piece.team == 0 else -1
            if piece.type == 'Pharaoh':
                pharaohPositions[piece.team] = piecePos
                continue

            // if piece.type == 'Obelisk':
            //     feats['Obelisks diff'] += teamToggle
            if piece.type == 'Pyramid':
                feats['Pyramids diff'] += teamToggle
                feats['Defensive Pyramids'] += 0.5 * teamToggle / (util.manhattanDistance(piecePos, pharaohPositions[piece.team]) + 1)
                feats['Offensive Pyramids'] += 0.5 * teamToggle / (util.manhattanDistance(piecePos, pharaohPositions[1 - piece.team]) + 1)
            elif piece.type == 'Djed':
                feats['Defensive Djeds'] += 0.5 * teamToggle / (util.manhattanDistance(piecePos, pharaohPositions[piece.team]) + 1)
                feats['Offensive Djeds'] += 0.5 * teamToggle / (util.manhattanDistance(piecePos, pharaohPositions[1 - piece.team]) + 1)

                // for x in (-1, 0, 1):
                //     for y in (-1, 0, 1):
                //         neighbour = boardState[(piecePos[0] + x, piecePos[1] + y)]
                //         if neighbour && neighbour.team != piece.team && neighbour.type in ('Obelisk', 'Pyramid'):
                //             feats['Enemies neighbouring Djeds'] += 0.1 * teamToggle


            if piecePos[0] == boardState.width - 1 && piece.type in ('Pyramid', 'Djed') && 'S' in piece.aspect:
                feats['Refectors on gold minus silver'] += 1 / (abs(piecePos[1] - pharaohPositions[1][1]) + 2)
            elif piecePos[0] == 0 && piece.type in ('Pyramid', 'Djed') && 'N' in piece.aspect:
                feats['Refectors on gold minus silver'] -= 1 / (abs(piecePos[1] - pharaohPositions[0][1]) + 2)

        // feats['Enemies neighbouring Djeds'] = self.attenuate(feats['Enemies neighbouring Djeds'])
        feats['Defensive Pyramids'] = self.attenuate(feats['Defensive Pyramids'])
        feats['Offensive Pyramids'] = self.attenuate(feats['Offensive Pyramids'])
        feats['Defensive Djeds'] = self.attenuate(feats['Defensive Djeds'])
        feats['Offensive Djeds'] = self.attenuate(feats['Offensive Djeds'])
        // feats['Refectors on gold minus silver'] = self.attenuate(feats['Refectors on gold minus silver'])

        // Path based:

        distFromPharaoh = [10, 10]
        for laser in (0, 1):
            pieceFrom_laser = 1
            laserPath = boardState.get_laserPath(laser)
            for position in laserPath:
                if position != null:
                    distFromPharaoh[0] = min(distFromPharaoh[0], max(abs(position[0] - pharaohPositions[0][0]), abs(position[1] - pharaohPositions[0][1])))
                    distFromPharaoh[1] = min(distFromPharaoh[1], max(abs(position[0] - pharaohPositions[1][0]), abs(position[1] - pharaohPositions[1][1])))

                if position in boardState:
                    piece = boardState[position]
                    if position != laserPath[-1]:
                        feats['Laser control'] += 0.5 * (1 if piece.team == 0 else -1) / pieceFrom_laser
                        pieceFrom_laser += 1
                    else:
                        feats['%ss threatened' % piece.__class__.__name__] += 1 if piece.team == 0 else -1

        if distFromPharaoh[0] != 0 && distFromPharaoh[1] != 0:
            feats['Laser near Pharaoh'] = 2**(-distFromPharaoh[0]) - 2**(-distFromPharaoh[1])

        // Paths from Pharaoh
        for team in (0, 1):
            x, y = pharaohPositions[team]
            teamToggle = 1 if team == 0 else -1
            for startPos, startDirection in [((x, y + 1), 'N'), ((x, y - 1), 'S'), ((x + 1, y), 'E'), ((x - 1, y), 'W')]:
                distFromPharaoh = 1
                path = boardState.getPath(startPos, startDirection)
                for position in path[:-1]:
                    if position in boardState:
                        if boardState[position].team == team:
                            feats['Teammates linking Pharaoh'] += 0.2 * teamToggle
                        else:
                            feats['Enemies linking Pharaoh'] += 0.2 * teamToggle

                    else:
                        feats['Spaces from Pharaoh'] += 0.2 * teamToggle / distFromPharaoh

                    distFromPharaoh += 1
                if path[-1] != null:
                    if boardState[path[-1]].team == team:
                        feats['Teammates blocking Pharaoh'] += 0.2 * teamToggle
                    else:
                        feats['Enemies blocking Pharaoh'] += 0.2 * teamToggle

        feats.pop('Obelisks threatened', null)

        return feats;
    }
}