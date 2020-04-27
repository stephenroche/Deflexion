class DeflexionExtractor {
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

        let pharaohPositions = [null, null];
        for (let [piecePos, piece] of boardState) {
            if (piece.type == 'Pharaoh') {
                pharaohPositions[piece.team] = piecePos;
            }
        }

        for (let [piecePos, piece] of boardState) {
            if (piece.type == 'Pharaoh') {
                continue;
            }
            let teamToggle = (piece.team == 0) ? 1 : -1;

            if (piece.type == 'Pyramid') {
                feats['Pyramids diff'] += teamToggle;
                feats['Defensive Pyramids'] += 0.5 * teamToggle / (manhattanDistance(piecePos, pharaohPositions[piece.team]) + 1);
                feats['Offensive Pyramids'] += 0.5 * teamToggle / (manhattanDistance(piecePos, pharaohPositions[1 - piece.team]) + 1);
            } else if (piece.type == 'Djed') {
                feats['Defensive Djeds'] += 0.5 * teamToggle / (manhattanDistance(piecePos, pharaohPositions[piece.team]) + 1);
                feats['Offensive Djeds'] += 0.5 * teamToggle / (manhattanDistance(piecePos, pharaohPositions[1 - piece.team]) + 1);
            }

            if (piecePos[0] == WIDTH - 1 && ['Pyramid', 'Djed'].includes(piece.type) && piece.aspect[1] == 1) {
                feats['Refectors on gold minus silver'] += 1 / (Math.abs(piecePos[1] - pharaohPositions[1][1]) + 2);
            } else if (piecePos[0] == 0 && ['Pyramid', 'Djed'].includes(piece.type) && piece.aspect[1] == -1) {
                feats['Refectors on gold minus silver'] -= 1 / (Math.abs(piecePos[1] - pharaohPositions[0][1]) + 2);
            }
        }
        feats['Defensive Pyramids'] = this.attenuate(feats['Defensive Pyramids']);
        feats['Offensive Pyramids'] = this.attenuate(feats['Offensive Pyramids']);
        feats['Defensive Djeds'] = this.attenuate(feats['Defensive Djeds']);
        feats['Offensive Djeds'] = this.attenuate(feats['Offensive Djeds']);

        // Path based:

        let distFromPharaoh = [WIDTH, WIDTH];
        for (let laser of [0, 1]) {
            let pieceFromLaser = 1;
            let laserPath = boardState.getLaserPath(laser);
            for (let [index, [x, y]] of laserPath.entries()) {
                distFromPharaoh[0] = Math.min(distFromPharaoh[0], Math.max(Math.abs(x - pharaohPositions[0][0]), Math.abs(y - pharaohPositions[0][1])))
                distFromPharaoh[1] = Math.min(distFromPharaoh[1], Math.max(Math.abs(x - pharaohPositions[1][0]), Math.abs(y - pharaohPositions[1][1])))

                if (boardState.contains(x, y)) {
                    let piece = boardState[x][y];
                    if (index != laserPath.length - 1) {
                        feats['Laser control'] += 0.5 * (piece.team == 0 ? 1 : -1) / pieceFromLaser;
                        pieceFromLaser += 1;
                    } else {
                        feats[piece.type + 's threatened'] += (piece.team == 0 ? 1 : -1);
                    }
                }
            }
        }
        if (distFromPharaoh[0] != 0 && distFromPharaoh[1] != 0) {
            feats['Laser near Pharaoh'] = 2**(-distFromPharaoh[0]) - 2**(-distFromPharaoh[1]);
        }

        // Paths from Pharaoh
        for (let team of [0, 1]) {
            let [pharaohX, pharaohY] = pharaohPositions[team];
            let teamToggle = (team == 0 ? 1 : -1);
            for (let startDirection of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                let distFromPharaoh = 1;
                let path = boardState.getPath([pharaohX, pharaohY], startDirection);
                for (let [x, y] of path.slice(1, path.length - 1)) {
                    if (boardState[x][y]) {
                        if (boardState[x][y].team == team) {
                            feats['Teammates linking Pharaoh'] += 0.2 * teamToggle;
                        } else {
                            feats['Enemies linking Pharaoh'] += 0.2 * teamToggle;
                        }
                    } else {
                        feats['Spaces from Pharaoh'] += 0.2 * teamToggle / distFromPharaoh;
                    }
                    distFromPharaoh += 1;
                }
                let [x, y] = path[path.length - 1];
                if (boardState.contains(x, y)) {
                    if (boardState[x][y].team == team) {
                        feats['Teammates blocking Pharaoh'] += 0.2 * teamToggle;
                    } else {
                        feats['Enemies blocking Pharaoh'] += 0.2 * teamToggle;
                    }
                }
            }
        }
        delete feats['Obelisks threatened'];

        return feats;
    }
}