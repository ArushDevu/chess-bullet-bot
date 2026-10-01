import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GameScreen from './GameScreen';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={
            <div>
              <h1>Home</h1>
              <Link to="/game">Go to game page</Link>
            </div>
          } />

            <Route path="/game" element={<GameScreen/>} />
        </Routes>
      </div>
    </Router>
    
  );
}

export default App;
