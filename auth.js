/**
 * auth.js
 * ─────────────────────────────────────────────────────────────
 * Firebase Authentication handler.
 *
 * Responsibilities:
 *  • Google Sign-In via popup
 *  • Sign-out
 *  • onAuthStateChanged listener — bridges auth state to the UI
 *
 * NOTE: Firebase imports are commented out for standalone demo mode.
 *       Uncomment them and remove the MOCK section when integrating
 *       real Firebase credentials.
 * ─────────────────────────────────────────────────────────────
 */

// ─── Real Firebase imports ─────────────
import { auth } from './firebase-config.js';
import { trackUserLogin } from './db.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * signInWithGoogle
 * ─────────────────────────────────────────────────────────────
 * Opens a Google OAuth popup and signs the user in.
 *
 * REAL IMPLEMENTATION:
 *   const provider = new GoogleAuthProvider();
 *   const result   = await signInWithPopup(auth, provider);
 *   return result.user;
 *
 * @returns {Promise<Object>} Resolved user object
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('[auth] signInWithGoogle failed:', error.code, error.message);
    throw error;
  }
}

/**
 * logout
 * ─────────────────────────────────────────────────────────────
 * Signs the current user out and clears all local state.
 *
 * REAL IMPLEMENTATION:
 *   await signOut(auth);
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[auth] logout failed:', error.code, error.message);
    throw error;
  }
}

/**
 * onAuthChange
 * ─────────────────────────────────────────────────────────────
 * Registers a callback that fires whenever authentication state
 * changes (sign-in, sign-out, token refresh).
 *
 * Callback receives either a Firebase User object or null.
 *
 * REAL IMPLEMENTATION:
 *   return onAuthStateChanged(auth, callback);   // returns unsubscribe fn
 *
 * @param   {Function} callback  (user: User | null) => void
 * @returns {Function}           Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const [userData, role] = await Promise.all([
          trackUserLogin(user),
          import('./db.js').then(module => module.getUserRole(user.uid))
        ]);

        console.log(`[auth] Authenticated as UID: ${user.uid}`);
        console.log(`[auth] Fetched Role:`, role);

        user.role = role || 'user'; // Assign the role

        if (userData && userData.lastLogin) {
          // Add the fetched last login info to the user object
          user.lastLoginData = userData.lastLogin.toDate ? userData.lastLogin.toDate() : new Date();
        }
      } catch (error) {
        console.error('[auth] Failed to track user login or fetch role:', error);
      }
    }
    callback(user);
  });
}

/**
 * getCurrentUser
 * ─────────────────────────────────────────────────────────────
 * Synchronously returns the currently signed-in user or null.
 * Useful for one-off reads where subscribing is unnecessary.
 *
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}
