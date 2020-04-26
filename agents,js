class RandomAgent {
    getAction(boardState) {
        let moves = boardState.getValidMoves();
        let move = randomChoice(moves);
        let laser = randomChoice([0, 1, null]);
        return [move, laser];
    }
}