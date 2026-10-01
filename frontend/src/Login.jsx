/**
 * Login.jsx
 *
 * Login page. Signs the user in with their username and password,
 * then sends them to the home page.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logIn } from './db';

function Login() {
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  /**
   * Runs when the form is submitted. Logs the user in and redirects
   * home on success, or shows the error message on failure.
   */
  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await logIn(username.trim(), password);
      navigate('/');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Log in</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <p>
        No account yet? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
