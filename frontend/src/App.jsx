/**
 * App.jsx
 *
 * Root component. Defines every page (route) in the app.
 *
 * Routes:
 *   /        Home page
 *   /game    Game screen
 *   /signup  Create an account
 *   /login   Log in
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import GameScreen from './GameScreen';
import Login from './Login';
import Signup from './Signup';

/**
 * Temporary home page. Move this into its own file (e.g. Home.jsx)
 * once it grows beyond a few links.
 */
function Home() {
  return (
    <div>
      <h1>Home</h1>

      <nav>
        <Link to="/game">Play</Link>
        {' | '}
        <Link to="/login">Log in</Link>
        {' | '}
        <Link to="/signup">Sign up</Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
