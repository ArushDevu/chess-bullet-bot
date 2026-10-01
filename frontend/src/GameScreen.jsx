import { Link } from 'react-router-dom';
import ChessBoard from './components/ChessBoard';
import Clock from './components/Clock';

function GameScreen() {
  return (
    <div>
      <h1>Game</h1>
      <Link to="/">Go to home page</Link>
      <Clock />
      <ChessBoard />
    </div>
  );
}

export default GameScreen;