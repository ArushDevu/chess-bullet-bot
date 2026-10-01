/**
 * Signup.jsx
 *
 * Sign-up page. Collects email, username and password and creates the
 * account through Supabase. Because email confirmation is on, the user
 * must click the link in their inbox before they can log in, so after a
 * successful sign-up we show a "check your email" message instead of
 * redirecting.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signUp } from './db';

// Supabase rejects passwords shorter than this by default.
const MIN_PASSWORD_LENGTH = 6;

function Signup() {
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  /**
   * Runs when the form is submitted. Creates the account, then shows the
   * "check your email" screen on success or the error message on failure.
   */
  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signUp(email, username.trim(), password);
      setIsSignupComplete(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // After a successful sign-up, replace the form with next steps.
  if (isSignupComplete) {
    return (
      <div>
        <h1>Check your email</h1>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then log in.
        </p>
        <Link to="/login">Go to login</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Sign up</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={20}
          title="3-20 characters: letters, numbers and _ only"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;
