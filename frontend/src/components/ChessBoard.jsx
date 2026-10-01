import { useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function ChessBoard() {
    // One Chess object for the whole game, so move history (and PGN) is kept
    const gameRef = useRef(new Chess());
    const game = gameRef.current;
    const [fen, setFen] = useState(game.fen());

    // v4 calls this as (source, target); v5 calls it with one object
    function makeMove(arg1, arg2) {
        const sourceSquare = typeof arg1 === 'object' ? arg1.sourceSquare : arg1;
        const targetSquare = typeof arg1 === 'object' ? arg1.targetSquare : arg2;

        if (!targetSquare) return false; // dropped off the board
        if (game.isGameOver()) return false;

        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // always queen for now
            });
            if (move === null) return false; // older chess.js returns null
        } catch {
            return false; // chess.js v1 throws on illegal moves
        }

        setFen(game.fen());
        return true;
    }

    function getStatus() {
        const side = game.turn() === 'w' ? 'White' : 'Black';
        const other = side === 'White' ? 'Black' : 'White';

        if (game.isCheckmate()) return `Checkmate — ${other} wins`;
        if (game.isStalemate()) return 'Draw by stalemate';
        if (game.isThreefoldRepetition()) return 'Draw by threefold repetition';
        if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
        if (game.isDraw()) return 'Draw by 50-move rule';
        if (game.inCheck()) return `${side} to move — check!`;
        return `${side} to move`;
    }

    function resetGame() {
        game.reset();
        setFen(game.fen());
    }

    return (
        <div style={{ width: '400px' }}>
            <p>{getStatus()}</p>

            <Chessboard
                // v5 reads these
                options={{
                    position: fen,
                    onPieceDrop: makeMove,
                    allowDragging: true,
                }}
                // v4 reads these
                position={fen}
                onPieceDrop={makeMove}
                arePiecesDraggable={true}
            />

            <button onClick={resetGame} style={{ marginTop: '10px' }}>
                New game
            </button>

            <p style={{ fontSize: '12px' }}>{game.pgn()}</p>
        </div>
    );
}

export default ChessBoard;