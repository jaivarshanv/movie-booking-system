
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

import { generateSeatLayout, handleSeatToggle, getSeatState } from './booking.js';
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
 * getCropStyle
 * Generates inline CSS for non-destructive dynamic cropping
 */
function getCropStyle(movie) {
  const pOrig = movie.posterOriginal;
  const crop = movie.posterCrop;

  if (!pOrig || !crop || !crop.width || !crop.naturalWidth) {
    return 'width: 100%; height: 100%; object-fit: cover;';
  }

  const widthPct = (crop.naturalWidth / crop.width) * 100;
  const heightPct = (crop.naturalHeight / crop.height) * 100;
  const leftPct = -(crop.x / crop.width) * 100;
  const topPct = -(crop.y / crop.height) * 100;

  return `position: absolute; max-width: none; width: ${widthPct}%; height: ${heightPct}%; left: ${leftPct}%; top: ${topPct}%; object-fit: fill;`;
}

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
      <div class="movie-card__image-container">
        <div class="movie-card__poster-wrap">
          <img
            class="movie-card__poster"
            src="${movie.posterOriginal || movie.poster}"
            alt="${movie.title} poster"
            loading="lazy"
            onerror="this.onerror=null; this.style.position=''; this.style.width='100%'; this.style.height='100%'; this.style.left='0'; this.style.top='0'; this.style.objectFit='cover'; this.src='https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=60';"
            style="${getCropStyle(movie)}"
          />
        </div>
        <div class="movie-card__rating-strip">
          <span style="color: #FF3131; font-size: 14px;">★</span> ${movie.rating}/10
        </div>
      </div>
      <h2 class="movie-card__title">${movie.title}</h2>
      <p class="movie-card__genre">${movie.genre}</p>
    </article>
  `).join('');

  EL.viewContainer.innerHTML = `
    <section class="view">
      <div class="dashboard-hero">
        <header class="view__header" style="margin-bottom: 0;">
          <p class="view__eyebrow">Now Showing</p>
          <h1 class="view__title">What will you<br/>watch tonight?</h1>
          <p class="view__subtitle">Select a film to explore showtimes.</p>
        </header>
        <div class="ai-chat-widget" id="ai-chat-widget">
          <div class="ai-chat__header">
            <span class="ai-chat__badge">AI</span>
            <span class="ai-chat__label">Find your perfect film</span>
          </div>
          <div class="ai-chat__messages" id="ai-chat-messages">
            <div class="ai-chat__msg ai-chat__msg--bot">
              Hey! Tell me what kind of movie you're in the mood for — genre, feeling, or anything on your mind.
            </div>
          </div>
          <form class="ai-chat__form" id="ai-chat-form">
            <input
              id="ai-chat-input"
              class="ai-chat__input"
              type="text"
              placeholder="e.g. something thrilling, or a light comedy…"
              autocomplete="off"
            />
            <button type="submit" class="ai-chat__send" aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      </div>
      <div class="bento-grid" style="margin-top: var(--space-2xl);">
        ${cards}
      </div>
    </section>
  `;

  // Attach movie card click handlers
  EL.viewContainer.querySelectorAll('.movie-card').forEach(card => {
    const id = card.dataset.movieId;
    const movie = movies.find(m => m.id === id);
    const handler = () => onMovieClick(movie);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });


  // ── Groq Chat (Llama 3.3) with local fallback ──────────────────
  // Key is loaded from groq-config.js (excluded from git via .gitignore)
  const GROQ_API_KEY = window.__GROQ_KEY__ || '';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const movieContext = movies.map(m =>
    `- "${m.title}" | Genre: ${m.genre} | Rating: ${m.rating}/10 | Duration: ${m.duration} | Synopsis: ${m.synopsis || 'N/A'}`
  ).join('\n');

  const systemPrompt = `You are a friendly movie concierge for BookMySeat cinema. Your only job is to chat briefly with the user, understand their mood/preferences, and recommend ONE movie from the list below that is currently showing.

Available movies (ONLY recommend from this list):
${movieContext}

Rules:
1. Keep every response to 2-3 sentences max.
2. Ask at most one follow-up question before recommending.
3. When recommending, mention the title in quotes and give a one-line reason.
4. End your recommendation message with exactly this tag on its own: RECOMMEND:"<exact movie title>"
5. Never discuss anything unrelated to movies.`;

  const chatHistory = []; // OpenAI format: [{role, content}]
  const messagesEl = document.getElementById('ai-chat-messages');
  const form = document.getElementById('ai-chat-form');
  const input = document.getElementById('ai-chat-input');

  // ── Local fallback engine ──────────────────────────────────────
  const MOOD_MAP = {
    action:    ['action','fight','battle','war','hero','adrenaline','explosive','martial','combat'],
    adventure: ['adventure','journey','quest','explore','epic','fantasy','travel'],
    comedy:    ['comedy','funny','laugh','humor','light','fun','happy','hilarious','feel good'],
    drama:     ['drama','emotional','deep','touching','serious','intense','story'],
    romance:   ['romance','romantic','love','couple','date','sweet','heart','relationship'],
    horror:    ['horror','scary','fear','ghost','dark','creepy','terror'],
    thriller:  ['thriller','suspense','mystery','twist','crime','detective','tension','psychological'],
    scifi:     ['sci-fi','scifi','space','future','robot','alien','science fiction','tech'],
  };
  const detectMoods = (text) => {
    const lower = text.toLowerCase();
    return Object.keys(MOOD_MAP).filter(mood => MOOD_MAP[mood].some(kw => lower.includes(kw)));
  };
  const scoreMoods = (detected) => movies.map(movie => {
    const hay = `${movie.genre} ${movie.title} ${movie.synopsis || ''}`.toLowerCase();
    let score = parseFloat(movie.rating) || 0;
    detected.forEach(mood => MOOD_MAP[mood]?.forEach(kw => { if (hay.includes(kw)) score += 4; }));
    return { movie, score };
  }).sort((a, b) => b.score - a.score);

  let localState = 'ask_mood';
  let collectedMoods = [];

  const localReply = (userText) => {
    const moods = detectMoods(userText);
    collectedMoods = [...new Set([...collectedMoods, ...moods])];
    if (localState === 'ask_mood') {
      if (collectedMoods.length > 0) {
        localState = 'done';
        const best = scoreMoods(collectedMoods)[0].movie;
        return { text: `Based on your vibe, I think you'll love "${best.title}" — ${best.genre}, ${best.rating}/10.`, recommend: best };
      } else {
        localState = 'ask_follow';
        return { text: `Got it! Are you in the mood for something exciting like action or thriller, or something lighter like comedy or romance?` };
      }
    } else if (localState === 'ask_follow') {
      localState = 'done';
      if (collectedMoods.length > 0) {
        const best = scoreMoods(collectedMoods)[0].movie;
        return { text: `Perfect! I'd go with "${best.title}" — ${best.genre}, ${best.rating}/10.`, recommend: best };
      } else {
        const best = [...movies].sort((a, b) => (parseFloat(b.rating)||0) - (parseFloat(a.rating)||0))[0];
        return { text: `Let me pick our top-rated film for you — "${best.title}"! ${best.genre}, ${best.rating}/10.`, recommend: best };
      }
    }
    return { text: `Tap the "Book" button to grab your seats!` };
  };
  // ─────────────────────────────────────────────────────────────────

  const addMessage = (text, isBot) => {
    const div = document.createElement('div');
    div.className = `ai-chat__msg ${isBot ? 'ai-chat__msg--bot' : 'ai-chat__msg--user'}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  };

  const addTypingIndicator = () => {
    const div = document.createElement('div');
    div.className = 'ai-chat__msg ai-chat__msg--bot ai-chat__msg--typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  };

  const showRecommendation = (movie) => {
    setTimeout(() => {
      const card = EL.viewContainer.querySelector(`[data-movie-id="${movie.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.outline = '2px solid var(--clr-accent)';
        card.style.outlineOffset = '4px';
      }
    }, 300);
    setTimeout(() => {
      const bookDiv = document.createElement('div');
      bookDiv.className = 'ai-chat__msg ai-chat__msg--bot';
      bookDiv.innerHTML = `<button class="ai-chat__book-btn">Book "${movie.title}" →</button>`;
      messagesEl.appendChild(bookDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      bookDiv.querySelector('.ai-chat__book-btn').addEventListener('click', () => onMovieClick(movie));
    }, 500);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    input.value = '';
    input.disabled = true;
    addMessage(userText, false);
    chatHistory.push({ role: 'user', content: userText });

    const typingEl = addTypingIndicator();

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory
          ],
          temperature: 0.7,
          max_tokens: 256
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const botText = data?.choices?.[0]?.message?.content?.trim();
      if (!botText) throw new Error('Empty response');

      typingEl.remove();
      chatHistory.push({ role: 'assistant', content: botText });

      const recMatch = botText.match(/RECOMMEND:"([^"]+)"/);
      if (recMatch) {
        const cleanText = botText.replace(/RECOMMEND:"[^"]+"\s*/g, '').trim();
        addMessage(cleanText || `I recommend "${recMatch[1]}"!`, true);
        const recommended = movies.find(m =>
          m.title.toLowerCase() === recMatch[1].toLowerCase() ||
          m.title.toLowerCase().includes(recMatch[1].toLowerCase())
        );
        if (recommended) showRecommendation(recommended);
      } else {
        addMessage(botText, true);
      }

    } catch (err) {
      typingEl.remove();
      console.warn('[Chat] Groq unavailable, using local engine:', err.message);
      const result = localReply(userText);
      addMessage(result.text, true);
      if (result.recommend) showRecommendation(result.recommend);
    } finally {
      input.disabled = false;
      input.focus();
    }
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

  // 1. Extract and sort unique dates from all showtimes
  const uniqueDates = new Set();
  theaters.forEach(t => t.showtimes.forEach(st => {
    if (st.date) uniqueDates.add(st.date);
  }));
  const datesList = Array.from(uniqueDates).sort();

  // If no dates/showtimes exist for this movie
  if (datesList.length === 0) {
    EL.viewContainer.innerHTML = `
      <section class="view">
        <button class="back-btn" id="back-to-dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          All Movies
        </button>
        <header class="view__header">
          <h1 class="view__title">${movie.title}</h1>
          <p class="view__subtitle">No showtimes scheduled yet.</p>
        </header>
      </section>
    `;
    document.getElementById('back-to-dashboard').addEventListener('click', onBack);
    return;
  }

  let selectedDate = datesList[0];

  function renderContent() {
    // Render Date Carousel
    const datesHTML = datesList.map(dateStr => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const isSelected = dateStr === selectedDate;

      return `
        <button class="date-pill ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
          <span style="font-size: 10px; opacity: 0.8;">${dayName}</span>
          <span style="font-size: 20px; font-weight: 600; margin: 2px 0;">${dayNum}</span>
          <span style="font-size: 10px; opacity: 0.8;">${monthName}</span>
        </button>
      `;
    }).join('');

    // Filter theaters and showtimes based on selected date
    const theaterCardsHTML = theaters.map((theater, ti) => {
      const filteredShowtimes = theater.showtimes.filter(st => st.date === selectedDate);
      if (filteredShowtimes.length === 0) return ''; // Hide theater if no shows on this date

      const showtimeBtns = filteredShowtimes.map(st => `
        <button
          class="showtime-btn ${st.availability === 'low' ? 'almost-full' : ''}"
          data-theater-idx="${ti}"
          data-showtime-id="${st.id}"
          aria-label="Select ${st.label} showtime"
        >
          <span style="color: ${st.availability === 'low' ? '#FF3131' : '#30d158'}; font-size:12px; margin-right:4px;">●</span>
          ${st.label}
        </button>
      `).join('');

      return `
        <div class="theater-card fade-in">
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

        <!-- Date Carousel -->
        <div class="date-carousel">
          ${datesHTML}
        </div>

        <div class="theater-list">
          ${theaterCardsHTML || '<p style="color:var(--clr-text-dim); text-align:center; padding: 40px 0;">No shows available on this date.</p>'}
        </div>
      </section>
    `;

    // Attach Listeners
    document.getElementById('back-to-dashboard').addEventListener('click', onBack);

    EL.viewContainer.querySelectorAll('.date-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedDate = e.currentTarget.dataset.date;
        renderContent();
      });
    });

    EL.viewContainer.querySelectorAll('.showtime-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tIdx = e.currentTarget.dataset.theaterIdx;
        const sId = e.currentTarget.dataset.showtimeId;
        const theater = theaters[tIdx];
        const showtime = theater.showtimes.find(s => s.id === sId);
        onShowtime(theater, showtime);
      });
    });
  }

  // Initial Render
  renderContent();
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
