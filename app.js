/**
 * app.js
 * ─────────────────────────────────────────────────────────────
 * Main Application Orchestrator.
 *
 * Responsibilities:
 *  • Bootstrap: wire auth, event listeners, initial render
 *  • Application state: current view, selected movie/theater/showtime
 *  • Client-side routing: navigate between SPA views
 *  • Coordinate between auth.js, db.js, booking.js, and ui.js
 *
 * This file intentionally contains ONLY coordination logic.
 * Data fetching → db.js | Rendering → ui.js | Seat logic → booking.js
 * ─────────────────────────────────────────────────────────────
 */

import { onAuthChange, signInWithGoogle, logout, getCurrentUser } from './auth.js';
import { getMovies, getTheaters, saveBooking, sendConfirmationEmail, seedDatabase, listenToSeats, clearPendingSeats, cancelBooking, getUserBookings, getAllShowtimes } from './db.js';
import { initBooking, getSelectionSummary, clearUserSelection, updateRealtimeSeats, stopTimer } from './booking.js';
import {
  showApp, showAuthGate,
  renderNavUser, updateBreadcrumb,
  renderMovieDashboard, renderShowtimeView, renderSeatView, renderContactView, renderUserBookingsView,
  updateBookingBar, showBookingBar, hideBookingBar,
  renderConfirmationView,
  renderLoading, updateSeatGrid, updateTimerUI, hideTimerUI
} from './ui.js';
import { renderAdminPortal } from './admin-portal.js';
import { renderClientPortal } from './client-portal.js';


// ═══════════════════════════════════════════════════════════════
//  APPLICATION STATE
//  Single source of truth for the current navigation context.
// ═══════════════════════════════════════════════════════════════

const AppState = {
  currentView: 'dashboard',   // 'dashboard' | 'showtimes' | 'seats'
  currentUser: null,          // Firebase User object
  movies: [],            // Movie[] fetched from db.js
  selectedMovie: null,          // Currently selected Movie
  theaters: [],            // Theater[] for selected movie
  selectedTheater: null,          // Currently selected Theater
  selectedShowtime: null,         // Currently selected Showtime
};


// ═══════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════════════════════════

/**
 * init
 * Entry point — called once on DOMContentLoaded.
 * Sets up the auth listener and static event bindings.
 */
function init() {
  // ── Auth state listener ───────────────────────────────────
  onAuthChange(user => {
    AppState.currentUser = user;

    if (user) {
      // User is authenticated — show main app
      showApp();
      renderNavUser(user);
      
      const adminBtn = document.getElementById('admin-portal-btn');
      const clientBtn = document.getElementById('client-portal-btn');
      
      if (user.role === 'admin') {
        adminBtn.classList.remove('hidden');
        clientBtn.classList.remove('hidden'); // Admin can access both
      } else if (user.role === 'client') {
        clientBtn.classList.remove('hidden');
      }

      navigateToDashboard();
    } else {
      // No user — show login screen
      showAuthGate();
      renderNavUser(null);
    }
  });

  // ── Static button bindings ────────────────────────────────
  bindStaticButtons();
}

/**
 * bindStaticButtons
 * Wire up buttons that are always present in the DOM (not rendered
 * dynamically by a view). These only need to be bound once.
 */
function bindStaticButtons() {
  // Google Sign-In
  document.getElementById('google-signin-btn').addEventListener('click', async () => {
    const btn = document.getElementById('google-signin-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('[app] Sign-in failed:', err);
      btn.disabled = false;
      btn.textContent = 'Continue with Google';
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    clearUserSelection();
    hideBookingBar();
    await logout();
  });

  // Confirm Booking
  document.getElementById('confirm-booking-btn').addEventListener('click', handleConfirmBooking);

  // Team Page
  document.getElementById('team-btn').addEventListener('click', navigateToContact);

  // My Bookings
  const bookingsBtn = document.getElementById('my-bookings-btn');
  if (bookingsBtn) bookingsBtn.addEventListener('click', navigateToBookings);

  // Admin Portal
  const adminBtn = document.getElementById('admin-portal-btn');
  if (adminBtn) adminBtn.addEventListener('click', navigateToAdminPortal);

  // Client Portal
  const clientBtn = document.getElementById('client-portal-btn');
  if (clientBtn) clientBtn.addEventListener('click', navigateToClientPortal);
}


// ═══════════════════════════════════════════════════════════════
//  NAVIGATION / ROUTING
// ═══════════════════════════════════════════════════════════════

/**
 * navigateToDashboard
 * Fetches movies (if not cached) and renders the movie grid.
 */
async function navigateToDashboard() {
  AppState.currentView = 'dashboard';

  // Reset selection context
  AppState.selectedMovie = null;
  AppState.selectedTheater = null;
  AppState.selectedShowtime = null;
  clearUserSelection();
  hideBookingBar();

  renderLoading('Loading films…');

  try {
    // Only fetch if not already cached
    if (AppState.movies.length === 0) {
      AppState.movies = await getMovies();
    }
    const allShowtimes = await getAllShowtimes();
    const activeMovieIds = new Set(allShowtimes.map(st => st.movieId));
    const activeMovies = AppState.movies.filter(m => activeMovieIds.has(m.id));

    renderMovieDashboard(activeMovies, navigateToShowtimes);
  } catch (err) {
    console.error('[app] Failed to load movies:', err);
    document.getElementById('view-container').innerHTML = `
      <div class="view" style="text-align:center;padding-top:var(--space-3xl)">
        <p style="color:var(--clr-text-dim)">Could not load films. Please try again.</p>
      </div>
    `;
  }
}

/**
 * navigateToShowtimes
 * Loads theaters for the selected movie and renders the showtime view.
 *
 * @param {Movie} movie
 */
async function navigateToShowtimes(movie) {
  AppState.currentView = 'showtimes';
  AppState.selectedMovie = movie;

  renderLoading(`Loading showtimes for ${movie.title}…`);

  try {
    AppState.theaters = await getTheaters(movie.id);
    renderShowtimeView(
      movie,
      AppState.theaters,
      navigateToDashboard,      // onBack
      navigateToSeats           // onShowtime(theater, showtime)
    );
  } catch (err) {
    console.error('[app] Failed to load theaters:', err);
  }
}

/**
 * navigateToSeats
 * Loads booked seats for the selected showtime and renders the seat grid.
 *
 * @param {Theater}  theater
 * @param {Showtime} showtime
 */
async function navigateToSeats(theater, showtime) {
  AppState.currentView = 'seats';
  AppState.selectedTheater = theater;
  AppState.selectedShowtime = showtime;

  renderLoading('Loading seat map…');

  try {
    const user = getCurrentUser();
    
    // Setup real-time listener
    listenToSeats(AppState.selectedMovie.id, showtime.id, user?.uid, (seatStates) => {
      // 1. Update booking module state
      updateRealtimeSeats(seatStates);
      
      // 2. Re-render UI grid
      updateSeatGrid(seatStates);
    });

    // Initialize the booking module
    initBooking(
      { 
        movieId: AppState.selectedMovie.id, 
        showtimeId: showtime.id, 
        userId: user?.uid,
        rows: showtime.rows || 8,
        cols: showtime.cols || 10
      },
      {},
      summary => { updateBookingBar(summary); }, // onChange
      timeStr => { updateTimerUI(timeStr); },    // onTick
      () => { 
        alert("Selection Timed Out."); 
        clearUserSelection(); 
        hideTimerUI(); 
      }                                          // onExpire
    );

    // Initial bar render (0 selected)
    updateBookingBar(getSelectionSummary());

    renderSeatView(
      {
        movie: AppState.selectedMovie,
        theater: AppState.selectedTheater,
        showtime: AppState.selectedShowtime,
        bookedSeats: [] // Handled by realtime updates now
      },
      () => { clearUserSelection(); hideTimerUI(); navigateToShowtimes(AppState.selectedMovie); },   // onBack
      summary => updateBookingBar(summary)                 // onSelectionChange (handled by initBooking now)
    );
  } catch (err) {
    console.error('[app] Failed to load seats:', err);
  }
}


/**
 * navigateToConfirmation
 * Loads the final success view after a booking is persisted.
 *
 * @param {Object} details
 */
function navigateToConfirmation(details) {
  AppState.currentView = 'confirmation';
  renderConfirmationView(
    details, 
    navigateToDashboard,
    async () => {
      // onCancel
      const confirmBtn = document.getElementById('view-cancel-booking-btn');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Canceling...';
      }
      try {
        await cancelBooking(details.confirmationId);
        alert("Booking canceled successfully. Your seats are now available for others.");
        navigateToDashboard();
      } catch (err) {
        alert("Failed to cancel booking. Please try again.");
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Cancel Booking';
        }
      }
    }
  );
}

/**
 * navigateToContact
 * Loads the development team page.
 */
function navigateToContact() {
  AppState.currentView = 'contact';
  renderContactView(navigateToDashboard);
}

/**
 * navigateToBookings
 * Loads the user's booking history and allows cancellation.
 */
async function navigateToBookings() {
  AppState.currentView = 'bookings';
  clearUserSelection();
  hideBookingBar();
  
  const user = getCurrentUser();
  if (!user) {
    alert("You must be logged in to view your bookings.");
    return;
  }

  renderLoading('Loading your bookings...');
  
  try {
    const bookings = await getUserBookings(user.uid);
    renderUserBookingsView(
      bookings,
      navigateToDashboard, // onBack
      async (confirmationId) => { // onCancel
        try {
          await cancelBooking(confirmationId);
          alert("Booking canceled successfully. Seats are now available.");
          navigateToBookings(); // refresh the list
        } catch (err) {
          alert("Failed to cancel booking. Please try again.");
          navigateToBookings(); // reset state
        }
      }
    );
  } catch (err) {
    console.error('[app] Failed to load bookings:', err);
    alert("Could not load bookings.");
    navigateToDashboard();
  }
}

/**
 * navigateToAdminPortal
 */
function navigateToAdminPortal() {
  AppState.currentView = 'admin';
  clearUserSelection();
  hideBookingBar();
  const container = document.getElementById('view-container');
  renderAdminPortal(container, navigateToDashboard, getCurrentUser());
}

/**
 * navigateToClientPortal
 */
function navigateToClientPortal() {
  AppState.currentView = 'client';
  clearUserSelection();
  hideBookingBar();
  const container = document.getElementById('view-container');
  renderClientPortal(container, navigateToDashboard, getCurrentUser());
}

// ═══════════════════════════════════════════════════════════════
//  BOOKING FLOW
// ═══════════════════════════════════════════════════════════════

/**
 * handleConfirmBooking
 * Orchestrates the full booking confirmation:
 *  1. Collect summary from booking.js
 *  2. Save to Firestore via db.js
 *  3. Send confirmation email via db.js
 *  4. Show confirmation modal via ui.js
 */
async function handleConfirmBooking() {
  const summary = getSelectionSummary();
  if (summary.count === 0) return;

  const confirmBtn = document.getElementById('confirm-booking-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Confirming…';

  try {
    const user = getCurrentUser();
    const movie = AppState.selectedMovie;
    const theater = AppState.selectedTheater;
    const showtime = AppState.selectedShowtime;

    // Construct booking payload
    const bookingData = {
      userId: user?.uid ?? 'anonymous',
      userEmail: user?.email ?? '',
      movieId: movie.id,
      movieTitle: movie.title,
      theaterId: theater.id,
      theaterName: theater.name,
      showtimeId: showtime.id,
      showtime: showtime.label,
      seats: summary.seats,
      totalPrice: summary.totalPrice,
    };

    stopTimer();
    hideTimerUI();

    // Persist booking
    const confirmationId = await saveBooking(bookingData);

    // Send email (non-blocking — failure doesn't abort the flow)
    sendConfirmationEmail(user?.email ?? '', {
      ...bookingData,
      confirmationId
    }).catch(err => console.warn('[app] Email send failed (non-critical):', err));

    // Show success view (replaces modal)
    navigateToConfirmation({
      movie,
      theater,
      showtime,
      seats: summary.seats,
      totalPrice: summary.totalPrice,
      confirmationId
    });

  } catch (err) {
    console.error('[app] Booking failed:', err);
    alert(err.message || 'Booking failed. Please try again.');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Booking';
  }
}


// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
