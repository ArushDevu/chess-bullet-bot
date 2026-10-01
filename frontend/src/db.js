/**
 * db.js
 *
 * All communication with Supabase lives in this file. Pages and components
 * should import these functions instead of calling `supabase` directly, so
 * that database logic stays in one place and is easy to change later.
 *
 * Tables:
 *   profiles: id, username, elo_rating, games_played, created_at
 *   games:    id, white_player_id, black_player_id, pgn_data, status
 */

import { supabase } from './supabaseClient';

// Shown for any failed login, so attackers can't tell whether
// the username or the password was the wrong part.
const INVALID_LOGIN_MESSAGE = 'Invalid username or password';

// Usernames: 3-20 characters, letters, numbers and underscores only.
// Keep this in sync with the `username_format` check in the database.
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns an error message if the username is invalid, or null if it's fine.
 *
 * @param {string} username
 * @returns {string|null}
 */
export function validateUsername(username) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-20 characters: letters, numbers and _ only';
  }
  return null;
}

/**
 * Checks whether a username is already in use (case-insensitive,
 * so "Arush" and "arush" count as the same name).
 *
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function isUsernameTaken(username) {
  const { data, error } = await supabase.rpc('is_username_taken', {
    p_username: username,
  });

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/* Authentication                                                     */
/* ------------------------------------------------------------------ */

/**
 * Creates a new account.
 *
 * The username is passed as user metadata. A database trigger
 * (handle_new_user) copies it into the `profiles` table automatically.
 *
 * Checks, in order:
 *   1. Username format (3-20 chars, letters/numbers/_)
 *   2. Username not already taken (case-insensitive)
 *   3. Email not already registered (enforced by Supabase Auth)
 *
 * @param {string} email
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} The new user and session.
 * @throws With a user-friendly message if any check fails.
 */
export async function signUp(email, username, password) {
  const formatError = validateUsername(username);
  if (formatError) throw new Error(formatError);

  if (await isUsernameTaken(username)) {
    throw new Error('That username is already taken');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      // Where the "confirm your email" link sends the user afterwards.
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) throw new Error(toFriendlySignUpError(error));

  // With email confirmation on, Supabase doesn't return an error for an
  // email that's already registered (so attackers can't probe which emails
  // exist). Instead it returns a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('An account with that email already exists');
  }

  return data;
}

/**
 * Converts Supabase's sign-up errors into messages a user can act on.
 *
 * @param {Error} error
 * @returns {string}
 */
function toFriendlySignUpError(error) {
  const message = error.message.toLowerCase();

  if (message.includes('already registered')) {
    return 'An account with that email already exists';
  }

  // The profile insert failed inside the database trigger. This almost
  // always means someone grabbed the same username a moment earlier.
  if (message.includes('database error saving new user')) {
    return 'That username is already taken';
  }

  return error.message;
}

/**
 * Logs a user in with their username and password.
 *
 * Supabase Auth only supports email login, so we first look up the email
 * that belongs to the username (via the get_email_for_username database
 * function), then sign in with that email.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} The logged-in user and session.
 * @throws If the username doesn't exist or the password is wrong.
 */
export async function logIn(username, password) {
  // Step 1: find the email that belongs to this username.
  const { data: email, error: lookupError } = await supabase.rpc(
    'get_email_for_username',
    { p_username: username }
  );

  if (lookupError) {
    // A real problem (e.g. the database function is missing), not a wrong
    // username. Log the details so they show up in the browser console.
    console.error('Username lookup failed:', lookupError);
    throw new Error('Something went wrong. Please try again.');
  }

  if (!email) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  // Step 2: sign in with that email and the given password.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign-in failed:', error);

    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new Error('Please confirm your email before logging in');
    }

    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  return data;
}

/**
 * Logs the current user out.
 */
export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Returns the currently logged-in user, or null if nobody is logged in.
 *
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/* ------------------------------------------------------------------ */
/* Profiles                                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetches a single user's profile.
 *
 * @param {string} userId - The user's UUID (same as their auth id).
 * @returns {Promise<object>} The profile row.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates fields on a user's profile.
 *
 * @example
 *   await updateProfile(user.id, { elo_rating: 1250, games_played: 11 });
 *
 * @param {string} userId
 * @param {object} updates - Only the columns you want to change.
 * @returns {Promise<object>} The updated profile row.
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/* Games                                                              */
/* ------------------------------------------------------------------ */

/**
 * Saves a game to the database.
 *
 * @example
 *   await saveGame({
 *     whitePlayerId: user.id,
 *     blackPlayerId: opponentId,
 *     pgn: '1. e4 e5 2. Nf3 ...',
 *     status: 'finished',
 *   });
 *
 * @param {object} game
 * @param {string} game.whitePlayerId
 * @param {string} game.blackPlayerId
 * @param {string} game.pgn - The full game in PGN format.
 * @param {string} game.status - e.g. 'in_progress' or 'finished'.
 * @returns {Promise<object>} The saved game row.
 */
export async function saveGame({ whitePlayerId, blackPlayerId, pgn, status }) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      white_player_id: whitePlayerId,
      black_player_id: blackPlayerId,
      pgn_data: pgn,
      status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches games a user played in, as either white or black.
 *
 * @param {string} userId
 * @param {number} [limit=50] - Maximum number of games to return.
 * @returns {Promise<object[]>} A list of game rows.
 */
export async function getGamesForUser(userId, limit = 50) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`)
    .limit(limit);

  if (error) throw error;
  return data;
}
