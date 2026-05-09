/**
 * firebase-config.js
 * ─────────────────────────────────────────────────────────────
 * Firebase SDK initialization.
 * Replace ALL placeholder values with your actual Firebase
 * project credentials from the Firebase Console.
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Your web app's Firebase configuration object.
 * Obtain this from: Firebase Console → Project Settings → General → Your Apps.
 *
 * ⚠️  IMPORTANT: For production, restrict API key usage in Google Cloud Console
 *     to allowed domains and services. Never commit real keys to version control.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCeCyn2m0yjuoe6ra_ElXpyDYC3xeMibqA",
  authDomain: "web-prog-authenticator.firebaseapp.com",
  projectId: "web-prog-authenticator",
  storageBucket: "web-prog-authenticator.firebasestorage.app",
  messagingSenderId: "86200810600",
  appId: "1:86200810600:web:47739eb4cd4f0fd852cfdd",
  measurementId: "G-FD669XGL4Q"
};

// ─── Initialize Firebase ──────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
