
/**
 * ui.js
 * ─────────────────────────────────────────────────────────────
 * UI Rendering Engine — all DOM manipulation lives here.
 *
 * Strict separation: ui.js NEVER fetches data or contains
 * business logic. It receives plain data objects and paints them.
 *
 * Exported functions correspond to SPA "views" and UI regions.
 * ─────────────────────────────────────────────────────────────
 */

import { generateSeatLayout, handleSeatToggle, getSeatState, ROW_CATEGORIES } from './booking.js';
import { PRICING } from './db.js';


// ═══════════════════════════════════════════════════════════════
//  ELEMENT CACHE — query once, reuse everywhere
// ═══════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

const EL = {
  authGate: $('auth-gate'),
  app: $('app'),
  viewContainer: $('view-container'),
  navBreadcrumb: $('nav-breadcrumb'),
  navUser: $('nav-user'),
  bookingBar: $('booking-bar'),
  barSeats: $('bar-seats'),
  barCount: $('bar-count'),
  barPrice: $('bar-price'),
  confirmBtn: $('confirm-booking-btn')
};


// ═══════════════════════════════════════════════════════════════
//  AUTH UI TRANSITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * showApp
 * Hides the auth gate and reveals the main application shell.
 * Called by app.js when onAuthStateChanged fires with a user.
 */
export function showApp() {
  EL.authGate.classList.add('hidden');
  EL.app.classList.remove('hidden');
}

/**
 * showAuthGate
 * Hides the main app and shows the login screen.
 * Called when user signs out.
 */
export function showAuthGate() {
  EL.app.classList.add('hidden');
  EL.authGate.classList.remove('hidden');
}

/**
 * renderNavUser
 * Renders the authenticated user's avatar + name in the top nav.
 *
 * @param {Object} user  Firebase User object (or mock equivalent)
 */
export function renderNavUser(user) {
  if (!user) { EL.navUser.innerHTML = ''; return; }

  let lastLoginHtml = '';
  if (user.lastLoginData) {
    const timeOpts = { hour: 'numeric', minute: '2-digit' };
    const timeStr = user.lastLoginData.toLocaleTimeString([], timeOpts);
    lastLoginHtml = `<span class="mono" style="font-size: 10px; color: var(--clr-text-dimmer); display: block; line-height: 1;">Last Login: ${timeStr}</span>`;
  }

  EL.navUser.innerHTML = `
    <div class="nav-user-pill">
      <img
        src="${user.photoURL || `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.displayName}`}"
        alt="${user.displayName}"
        onerror="this.src='https://api.dicebear.com/9.x/thumbs/svg?seed=user'"
      />
      <div style="display: flex; flex-direction: column;">
        <span class="nav-user-pill__name" style="line-height: 1.2;">${user.displayName || user.email}</span>
        ${lastLoginHtml}
      </div>
    </div>
  `;
}

/**
 * updateBreadcrumb
 * Updates the nav center breadcrumb based on current view.
 *
 * @param {string[]} crumbs  e.g. ["Now Playing", "Neon Requiem", "Seat Selection"]
 */
export function updateBreadcrumb(crumbs) {
  if (!crumbs || crumbs.length === 0) {
    EL.navBreadcrumb.innerHTML = '';
    return;
  }
  const parts = crumbs.map((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    return isLast
      ? `<span class="breadcrumb__current">${crumb}</span>`
      : `<span>${crumb}</span><span class="breadcrumb__sep">›</span>`;
  });
  EL.navBreadcrumb.innerHTML = `<nav class="breadcrumb">${parts.join('')}</nav>`;
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: MOVIE DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * renderMovieDashboard
 * Renders the bento grid of currently showing movies.
 *
 * @param {Movie[]}  movies       Array of movie objects from db.js
 * @param {Function} onMovieClick  Callback(movie) when a card is clicked
 */
export function renderMovieDashboard(movies, onMovieClick) {
  updateBreadcrumb(['Now Playing']);
  hideBookingBar();

  const cards = movies.map((movie, i) => `
    <article
      class="movie-card"
      data-movie-id="${movie.id}"
      style="animation-delay: ${i * 80}ms"
      role="button"
      tabindex="0"
      aria-label="Book tickets for ${movie.title}"
    >
      <div class="movie-card__poster-wrap">
        <img
          class="movie-card__poster"
          src="${movie.poster}"
          alt="${movie.title} poster"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=60'"
        />
      </div>
      <div class="movie-card__body">
        <div class="movie-card__meta">
          <span class="movie-card__genre">${movie.genre}</span>
          <span class="movie-card__dot">·</span>
          <span class="movie-card__rating">${movie.rating} ★</span>
        </div>
        <h2 class="movie-card__title ${i % 3 === 2 ? '' : 'movie-card__title-sm'}">${movie.title}</h2>
        <p class="movie-card__duration mono">${movie.duration} · ${movie.language} · ${movie.format}</p>
        <div class="movie-card__cta">
          Book Now <span class="movie-card__cta-arrow">→</span>
        </div>
      </div>
    </article>
  `).join('');

  EL.viewContainer.innerHTML = `
    <section class="view">
      <header class="view__header">
        <p class="view__eyebrow">Now Showing</p>
        <h1 class="view__title">What will you<br/>watch tonight?</h1>
        <p class="view__subtitle">Select a film to explore showtimes.</p>
      </header>
      <div class="bento-grid">
        ${cards}
      </div>
    </section>
  `;

  // Attach click handlers
  EL.viewContainer.querySelectorAll('.movie-card').forEach(card => {
    const id = card.dataset.movieId;
    const movie = movies.find(m => m.id === id);
    const handler = () => onMovieClick(movie);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: SHOWTIME / THEATER SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * renderShowtimeView
 * Renders the theater + showtime selection screen.
 *
 * @param {Movie}    movie          Currently selected movie
 * @param {Theater[]} theaters      List of theater objects
 * @param {Function} onBack         Navigate back to dashboard
 * @param {Function} onShowtime     Callback(theater, showtime) on selection
 */
export function renderShowtimeView(movie, theaters, onBack, onShowtime) {
  updateBreadcrumb(['Now Playing', movie.title]);
  hideBookingBar();

  const theaterCards = theaters.map((theater, ti) => {
    const showtimeBtns = theater.showtimes.map(st => `
      <button
        class="showtime-btn ${st.availability === 'low' ? 'almost-full' : ''}"
        data-theater-idx="${ti}"
        data-showtime-id="${st.id}"
        aria-label="Select ${st.label} showtime"
      >
        ${st.label}
        ${st.availability === 'low' ? '<br/><span style="font-size:9px;opacity:0.7">FAST FILLING</span>' : ''}
      </button>
    `).join('');

    return `
      <div class="theater-card" style="animation-delay: ${ti * 100}ms">
        <div class="theater-card__header">
          <div>
            <h3 class="theater-card__name">${theater.name}</h3>
            <p class="theater-card__address">${theater.address}</p>
          </div>
          <span class="theater-card__format">${theater.format}</span>
        </div>
        <div class="showtime-row">
          ${showtimeBtns}
        </div>
      </div>
    `;
  }).join('');

  EL.viewContainer.innerHTML = `
    <section class="view">
      <button class="back-btn" id="back-to-dashboard">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        All Movies
      </button>
      <header class="view__header">
        <p class="view__eyebrow">${movie.genre} · ${movie.format}</p>
        <h1 class="view__title">${movie.title}</h1>
        <p class="view__subtitle">${movie.duration} · ${movie.language} · ★ ${movie.rating}</p>
      </header>
      <div class="theater-list">
        ${theaterCards}
      </div>
    </section>
  `;

  $('back-to-dashboard').addEventListener('click', onBack);

  // Wire showtime buttons
  EL.viewContainer.querySelectorAll('.showtime-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Visual active state
      EL.viewContainer.querySelectorAll('.showtime-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const theaterIdx = parseInt(btn.dataset.theaterIdx);
      const showtimeId = btn.dataset.showtimeId;
      const theater = theaters[theaterIdx];
      const showtime = theater.showtimes.find(s => s.id === showtimeId);

      onShowtime(theater, showtime);
    });
  });
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: SEAT SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * renderSeatView
 * Renders the full seat grid for an auditorium.
 * Applies 'booked' CSS class to pre-booked seats.
 * Wires click events that delegate to booking.js toggleSeat.
 *
 * @param {Object}   context           { movie, theater, showtime, bookedSeats }
 * @param {Function} onBack            Navigate back to showtime view
 * @param {Function} onSelectionChange Called after every seat toggle with summary
 */
export function renderSeatView(context, onBack, onSelectionChange) {
  const { movie, theater, showtime, bookedSeats } = context;

  updateBreadcrumb(['Now Playing', movie.title, 'Select Seats']);
  showBookingBar();

  const layout = generateSeatLayout();

  // Determine current category being rendered for section labels
  let lastCategory = null;

  const rowsHTML = layout.map(row => {
    // Category header row
    let categoryHeader = '';
    if (row.category !== lastCategory) {
      lastCategory = row.category;
      const priceLabel = `₹${PRICING[row.category]}`;
      categoryHeader = `
        <div class="seat-category">
          ${row.category.toUpperCase()} — <span class="mono">${priceLabel}</span>
        </div>
      `;
    }

    const seatsHTML = row.seats.map(seat => {
      const state = getSeatState(seat.id);
      const aisleGap = seat.isAisle ? '<div class="seat-aisle"></div>' : '';

      return `
        ${aisleGap}
        <div
          class="seat ${state}"
          data-seat-id="${seat.id}"
          data-state="${state}"
          title="${seat.id} — ₹${seat.price}"
          role="button"
          tabindex="${state === 'booked' ? -1 : 0}"
          aria-label="Seat ${seat.id}, ${state}, ₹${seat.price}"
          aria-pressed="${state === 'selected'}"
        ></div>
      `;
    }).join('');

    return `
      ${categoryHeader}
      <div class="seat-row">
        <span class="row-label">${row.label}</span>
        <div class="seats">${seatsHTML}</div>
      </div>
    `;
  }).join('');

  EL.viewContainer.innerHTML = `
    <div class="seat-view">
      <button class="back-btn" id="back-to-showtimes">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Showtimes
      </button>

      <div class="screen-wrap">
        <div class="screen"></div>
        <p class="screen-label">Screen</p>
      </div>

      <div class="seat-legend">
        <div class="legend-item">
          <div class="legend-seat available"></div> Available
        </div>
        <div class="legend-item">
          <div class="legend-seat selected"></div> Selected
        </div>
        <div class="legend-item">
          <div class="legend-seat booked"></div> Booked
        </div>
      </div>

      <div class="seat-grid" id="seat-grid">
        ${rowsHTML}
      </div>
    </div>
  `;

  $('back-to-showtimes').addEventListener('click', () => {
    hideBookingBar();
    onBack();
  });

  // ── Seat click delegation (one listener, not 80) ──────────
  $('seat-grid').addEventListener('click', e => {
    const seatEl = e.target.closest('.seat');
    if (!seatEl) return;
    const seatId = seatEl.dataset.seatId;
    handleSeatToggle(seatId);
  });

  // Keyboard navigation
  $('seat-grid').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const seatEl = e.target.closest('.seat');
    if (!seatEl) return;
    e.preventDefault();
    seatEl.click();
  });
}


// ═══════════════════════════════════════════════════════════════
//  BOOKING BAR
// ═══════════════════════════════════════════════════════════════

/**
 * updateBookingBar
 * Updates the sticky footer with live seat selection data.
 *
 * @param {{ seats: string[], count: number, totalPrice: number }} summary
 */
export function updateBookingBar(summary) {
  EL.barSeats.textContent = summary.seats.length > 0
    ? summary.seats.join(', ')
    : '—';
  EL.barCount.textContent = summary.count;
  EL.barPrice.textContent = `₹${summary.totalPrice}`;
  EL.confirmBtn.disabled = summary.count === 0;
}

export function updateSeatGrid(seatStates) {
  const grid = $('seat-grid');
  if (!grid) return;
  const seatEls = grid.querySelectorAll('.seat');
  seatEls.forEach(el => {
    const id = el.dataset.seatId;
    const state = seatStates[id] || 'available';
    el.className = `seat ${state}`;
    el.dataset.state = state;
    el.tabIndex = (state === 'booked' || state === 'pending') ? -1 : 0;
    el.setAttribute('aria-pressed', state === 'selected');
  });
}

export function updateTimerUI(timeStr) {
  const timerContainer = $('bar-timer');
  const timerValue = $('bar-timer-value');
  if (timerContainer && timerValue) {
    timerContainer.classList.remove('hidden');
    timerValue.textContent = timeStr;
  }
}

export function hideTimerUI() {
  const timerContainer = $('bar-timer');
  if (timerContainer) {
    timerContainer.classList.add('hidden');
  }
}

/** Show the sticky booking footer */
export function showBookingBar() {
  EL.bookingBar.classList.remove('hidden');
}

/** Hide the sticky booking footer */
export function hideBookingBar() {
  EL.bookingBar.classList.add('hidden');
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: CONFIRMATION
// ═══════════════════════════════════════════════════════════════

/**
 * renderConfirmationView
 * Renders the booking confirmation as a full dedicated page.
 *
 * @param {Object} details  { movie, theater, showtime, seats, totalPrice, confirmationId }
 * @param {Function} onContinue  Navigate back to dashboard
 * @param {Function} onCancel  Cancel the booking and free seats
 */
export function renderConfirmationView(details, onContinue, onCancel) {
  updateBreadcrumb(['Now Playing', details.movie.title, 'Booking Confirmed']);
  hideBookingBar();

  EL.viewContainer.innerHTML = `
    <section class="view" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh;">
      <div style="background: var(--clr-brand); color: white; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path focusable="false" d="M20 6L9 17l-5-5"/>
        </svg>
      </div>

      <header class="view__header" style="text-align: center;">
        <h1 class="view__title">Booking Confirmed!</h1>
        <p class="view__subtitle">Your tickets have been sent to your <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" style="color: var(--clr-text); text-decoration: underline; text-underline-offset: 3px;">email</a>.</p>
      </header>

      <div style="background: var(--clr-surface-2); padding: 32px; border-radius: var(--radius-lg); width: 100%; max-width: 500px; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--clr-border);">
          <span style="color: var(--clr-text-dim);">Film</span>
          <strong style="text-align: right;">${details.movie.title}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--clr-border);">
          <span style="color: var(--clr-text-dim);">Cinema</span>
          <strong style="text-align: right;">${details.theater.name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--clr-border);">
          <span style="color: var(--clr-text-dim);">Showtime</span>
          <strong class="mono" style="text-align: right;">${details.showtime.label}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--clr-border);">
          <span style="color: var(--clr-text-dim);">Seats</span>
          <strong class="mono" style="text-align: right;">${details.seats.join(' · ')}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--clr-border);">
          <span style="color: var(--clr-text-dim);">Total Paid</span>
          <strong class="mono accent" style="text-align: right; font-size: 1.25rem;">₹${details.totalPrice}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--clr-text-dim);">Confirmation ID</span>
          <span class="mono" style="font-size: 12px; color: var(--clr-text-dimmer);">${details.confirmationId}</span>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-top: 40px; justify-content: center; flex-wrap: wrap;">
        <button id="view-continue-btn" class="btn-primary" style="padding: 12px 32px; font-weight: 500;">
          Continue Browsing
        </button>
        <button id="view-cancel-booking-btn" class="btn-ghost" style="padding: 12px 32px; font-weight: 500; color: var(--clr-accent); border-color: var(--clr-accent);">
          Cancel Booking
        </button>
      </div>
    </section>
  `;

  $('view-continue-btn').addEventListener('click', onContinue);
  $('view-cancel-booking-btn').addEventListener('click', onCancel);
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: TEAM / CONTACT DEVS
// ═══════════════════════════════════════════════════════════════

export function renderContactView(onBack) {
  updateBreadcrumb(['Team']);
  hideBookingBar();

  const devs = [
    {
      name: 'Sanjay J',
      img: 'sj.jpg',
      phone: '+91 7010756792',
      email: 'sanjayjayakumar2006@gmail.com',
      linkedin: 'https://www.linkedin.com/in/sanjay-jk/',
      github: 'https://github.com/sanjayy-j'
    },
    {
      name: 'Jaivarshan V',
      img: 'jv.jpg',
      phone: '+91 9363618506',
      email: 'jaivarshanv@gmail.com',
      linkedin: 'https://www.linkedin.com/in/jaivarshan/',
      github: 'https://github.com/jaivarshanv'
    },
    {
      name: 'Jani Rose Lawwellman',
      img: 'ja.jpg',
      phone: '+91 9746101068',
      email: 'janiannus@gmail.com',
      linkedin: 'https://www.linkedin.com/in/jani-rose-lawwellman/',
      github: 'https://github.com/jani-rose'
    }
  ];

  const cardsHtml = devs.map((dev, i) => `
    <div class="theater-card" style="animation-delay: ${i * 100}ms; display: flex; flex-direction: column; gap: 16px;">
      
      <div style="display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--clr-border); padding-bottom: 16px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--clr-surface-2); display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 20px; font-weight: bold; border: 1px solid var(--clr-border-2); color: var(--clr-text); overflow: hidden;">
          <img src="${dev.img}" alt="${dev.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='${dev.name.charAt(0)}'" />
        </div>
        <div>
          <h2 style="font-size: 18px; font-weight: 600; line-height: 1.2;">${dev.name}</h2>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--clr-accent); letter-spacing: 0.1em; text-transform: uppercase;">Core Developer</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: var(--clr-text-dim);">
        <a href="tel:${dev.phone.replace(/\\s+/g, '')}" style="display: flex; align-items: center; gap: 12px; transition: color 0.15s ease;" onmouseover="this.style.color='var(--clr-text)'" onmouseout="this.style.color='var(--clr-text-dim)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span class="mono">${dev.phone}</span>
        </a>
        <a href="mailto:${dev.email}" style="display: flex; align-items: center; gap: 12px; transition: color 0.15s ease;" onmouseover="this.style.color='var(--clr-text)'" onmouseout="this.style.color='var(--clr-text-dim)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          ${dev.email}
        </a>
        <a href="${dev.linkedin}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; transition: color 0.15s ease;" onmouseover="this.style.color='var(--clr-text)'" onmouseout="this.style.color='var(--clr-text-dim)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          LinkedIn Profile
        </a>
        <a href="${dev.github}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; transition: color 0.15s ease;" onmouseover="this.style.color='var(--clr-text)'" onmouseout="this.style.color='var(--clr-text-dim)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          GitHub Profile
        </a>
      </div>

    </div>
  `).join('');

  EL.viewContainer.innerHTML = `
    <section class="view">
      <button class="back-btn" id="contact-back-btn" style="margin-bottom: 24px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to Dashboard
      </button>

      <header class="view__header">
        <p class="view__eyebrow">Development Team</p>
        <h1 class="view__title">Meet the Developers</h1>
        <p class="view__subtitle">The people behind BookMySeat. Feel free to get in touch!</p>
      </header>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 56px;">
        ${cardsHtml}
      </div>

      <header class="view__header" style="margin-bottom: 24px;">
        <p class="view__eyebrow" style="color: var(--clr-text-dim);">Guidance & Leadership</p>
        <h2 style="font-family: var(--font-serif); font-size: 28px;">Project Mentor</h2>
      </header>

      <div style="max-width: 400px;">
        <div class="theater-card" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--clr-border); padding-bottom: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--clr-surface-2); display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 20px; font-weight: bold; border: 1px solid var(--clr-border-2); color: var(--clr-text); overflow: hidden;">
              <img src="drb.jpg" alt="Dr. Baiju B V" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='D'" />
            </div>
            <div>
              <h2 style="font-size: 18px; font-weight: 600; line-height: 1.2;">Dr. Baiju B V</h2>
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--clr-accent); letter-spacing: 0.1em; text-transform: uppercase;">Project Mentor</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: var(--clr-text-dim);">
            <a href="https://www.linkedin.com/in/dr-baiju-b-v-09542b105/" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 12px; transition: color 0.15s ease;" onmouseover="this.style.color='var(--clr-text)'" onmouseout="this.style.color='var(--clr-text-dim)'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              Follow on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  $('contact-back-btn').addEventListener('click', onBack);
}


// ═══════════════════════════════════════════════════════════════
//  VIEW: USER BOOKINGS
// ═══════════════════════════════════════════════════════════════

export function renderUserBookingsView(bookings, onBack, onCancel) {
  updateBreadcrumb(['My Bookings']);
  hideBookingBar();

  if (bookings.length === 0) {
    EL.viewContainer.innerHTML = `
      <section class="view" style="text-align: center; padding-top: var(--space-3xl);">
        <button class="back-btn" id="bookings-back-btn" style="margin-bottom: 24px; margin-left: auto; margin-right: auto;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Dashboard
        </button>
        <h2 style="font-family: var(--font-serif); font-size: 32px; margin-bottom: 16px;">No Bookings Found</h2>
        <p style="color: var(--clr-text-dim);">You haven't booked any tickets yet.</p>
      </section>
    `;
  } else {
    // Sort bookings by creation time descending (assuming createdAt exists)
    bookings.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt) : 0;
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt) : 0;
      return timeB - timeA;
    });

    const cardsHtml = bookings.map(b => `
      <div class="theater-card" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--clr-border); padding-bottom: 8px;">
          <h3 style="font-size: 18px; font-weight: 600;">${b.movieTitle}</h3>
          <span class="mono accent" style="font-size: 14px;">₹${b.totalPrice}</span>
        </div>
        <p style="font-size: 14px; color: var(--clr-text-dim); margin-bottom: 0;">${b.theaterName} — <span class="mono" style="color: var(--clr-text);">${b.showtime}</span></p>
        <p style="font-size: 14px; color: var(--clr-text-dim); margin-top: 0;">Seats: <span class="mono" style="color: var(--clr-text);">${b.seats.join(', ')}</span></p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span class="mono" style="font-size: 10px; color: var(--clr-text-dimmer);">ID: ${b.confirmationId}</span>
          <button class="btn-ghost cancel-btn" data-id="${b.confirmationId}" style="color: var(--clr-accent); border-color: var(--clr-accent); padding: 4px 12px; font-size: 12px;">
            Cancel Booking
          </button>
        </div>
      </div>
    `).join('');

    EL.viewContainer.innerHTML = `
      <section class="view">
        <button class="back-btn" id="bookings-back-btn" style="margin-bottom: 24px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Dashboard
        </button>
        <header class="view__header">
          <p class="view__eyebrow">Your Account</p>
          <h1 class="view__title">My Bookings</h1>
        </header>
        <div style="display: flex; flex-direction: column; max-width: 600px;">
          ${cardsHtml}
        </div>
      </section>
    `;

    EL.viewContainer.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        btn.disabled = true;
        btn.textContent = 'Canceling...';
        onCancel(btn.dataset.id);
      });
    });
  }

  $('bookings-back-btn').addEventListener('click', onBack);
}


// ═══════════════════════════════════════════════════════════════
//  LOADING STATE
// ═══════════════════════════════════════════════════════════════

/**
 * renderLoading
 * Shows a minimal skeleton loader in the view container.
 */
export function renderLoading(message = 'Loading…') {
  hideBookingBar();
  EL.viewContainer.innerHTML = `
    <section class="view" style="padding-top: var(--space-3xl); text-align: center;">
      <p class="label" style="color: var(--clr-text-dimmer);">${message}</p>
    </section>
  `;
}
