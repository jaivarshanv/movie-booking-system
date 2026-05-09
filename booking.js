import { PRICING, toggleSeatStatus, clearPendingSeats } from './db.js';

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS — Grid Configuration
// ═══════════════════════════════════════════════════════════════

export const ROWS = 8;
export const COLS = 10;
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROW_CATEGORIES = {
  A: 'economy', B: 'economy', C: 'economy',
  D: 'standard', E: 'standard', 
  F: 'premium', G: 'premium', H: 'premium'
};
export const AISLE_AFTER_COL = 4;

// ═══════════════════════════════════════════════════════════════
//  MODULE STATE
// ═══════════════════════════════════════════════════════════════

let context = {
  movieId: null,
  showtimeId: null,
  userId: null
};

let seatStates = {}; // seatId -> 'available' | 'selected' | 'pending' | 'booked'
let _onSelectionChange = null;

// Timer State
let timerInterval = null;
let timerSeconds = 120; // 2 minutes
let isTimerRunning = false;
let _onTimerTick = null;
let _onTimerExpire = null;

export function initBooking(ctx, initialSeatStates, onChangeCallback, onTick, onExpire) {
  context = ctx;
  seatStates = initialSeatStates || {};
  _onSelectionChange = onChangeCallback;
  _onTimerTick = onTick;
  _onTimerExpire = onExpire;
  
  // Do NOT reset timer here if it's already running for this user
  // For simplicity, we reset it, but in a real app you'd want to persist timer state across page reloads
  resetTimer();
}

export function updateRealtimeSeats(newStates) {
  seatStates = newStates;
  if (_onSelectionChange) {
    _onSelectionChange(getSelectionSummary());
  }
}

export function getSeatState(seatId) {
  return seatStates[seatId] || 'available';
}

export async function handleSeatToggle(seatId) {
  const currentState = getSeatState(seatId);

  // Guard: booked or pending (by others) cannot be toggled by this user
  if (currentState === 'booked' || currentState === 'pending') {
    return;
  }

  try {
    if (currentState === 'selected') {
      // Optimistic update
      seatStates[seatId] = 'available';
      if (_onSelectionChange) _onSelectionChange(getSelectionSummary());

      await toggleSeatStatus(context.movieId, context.showtimeId, seatId, context.userId, 'available');
      
      const summary = getSelectionSummary();
      if (summary.count === 0) {
        stopTimer();
      }
    } else if (currentState === 'available') {
      // Optimistic update
      seatStates[seatId] = 'selected';
      if (_onSelectionChange) _onSelectionChange(getSelectionSummary());

      await toggleSeatStatus(context.movieId, context.showtimeId, seatId, context.userId, 'pending');
      
      if (!isTimerRunning) {
        startTimer();
      }
    }
  } catch (error) {
    console.error("Failed to toggle seat:", error);
    // Revert optimistic update via the listener eventually, but we could do it here
  }
}

export function getSelectionSummary() {
  const selectedSeats = Object.keys(seatStates).filter(id => seatStates[id] === 'selected').sort(_compareSeatIds);
  
  let totalPrice = 0;
  const breakdown = { premium: 0, standard: 0, economy: 0 };

  for (const seatId of selectedSeats) {
    const row = seatId[0];
    const category = ROW_CATEGORIES[row];
    const price = PRICING[category] ?? 0;
    totalPrice += price;
    breakdown[category]++;
  }

  return {
    seats: selectedSeats,
    count: selectedSeats.length,
    totalPrice,
    breakdown
  };
}

export async function clearUserSelection() {
  stopTimer();
  await clearPendingSeats(context.movieId, context.showtimeId, context.userId);
  // States will naturally update via listener
}

export function generateSeatLayout() {
  return ROW_LABELS.map(rowLabel => {
    const category = ROW_CATEGORIES[rowLabel];
    const price = PRICING[category];
    const seats = [];
    for (let col = 1; col <= COLS; col++) {
      seats.push({
        id: `${rowLabel}${col}`,
        row: rowLabel,
        col,
        category,
        price,
        isAisle: col === AISLE_AFTER_COL
      });
    }
    return { label: rowLabel, category, seats };
  });
}

function _compareSeatIds(a, b) {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  return parseInt(a.slice(1)) - parseInt(b.slice(1));
}

// ─── Timer Logic ──────────────────────────────────────────────

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  timerSeconds = 120;
  
  if (_onTimerTick) _onTimerTick(formatTime(timerSeconds));

  timerInterval = setInterval(() => {
    timerSeconds--;
    if (_onTimerTick) _onTimerTick(formatTime(timerSeconds));

    if (timerSeconds <= 0) {
      stopTimer();
      if (_onTimerExpire) _onTimerExpire();
    }
  }, 1000);
}

export function stopTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 120;
}

function resetTimer() {
  stopTimer();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
