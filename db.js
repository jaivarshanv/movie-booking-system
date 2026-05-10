import { firestore } from './firebase-config.js';
import {
  collection, doc, getDoc, getDocs,
  addDoc, serverTimestamp, query, where,
  setDoc, increment, onSnapshot, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ═══════════════════════════════════════════════════════════════
//  MOCK DATA SEEDING (Run once via UI)
// ═══════════════════════════════════════════════════════════════
export async function seedDatabase() {
  const MOCK_MOVIES = [
    { id: "mv_001", title: "Neon Requiem", genre: "Sci-Fi · Thriller", rating: "8.9", duration: "2h 18m", language: "English", format: "4DX", poster: "https://images.unsplash.com/photo-1696523404089-0e159c91a7f5?w=800&q=80", synopsis: "In a rain-soaked megacity of 2089, a rogue AI composer creates music that drives listeners to madness." },
    { id: "mv_002", title: "The Pale Meridian", genre: "Drama · Mystery", rating: "7.6", duration: "1h 54m", language: "English", format: "Dolby Atmos", poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&q=80", synopsis: "A cartographer mapping uncharted territories begins to doubt the reality of the maps themselves." },
    { id: "mv_003", title: "Fracture Line", genre: "Action · Drama", rating: "8.2", duration: "2h 05m", language: "Hindi", format: "IMAX", poster: "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?w=800&q=80", synopsis: "A demolitions expert uncovers a conspiracy while dismantling a condemned bridge." }
  ];

  const MOCK_THEATERS = [
    { id: "th_001", name: "PVR Cinemas — Phoenix", address: "Viman Nagar, Pune", format: "IMAX", showtimes: [{ id: "st_001_1", time: "10:15", label: "10:15 AM", availability: "high" }, { id: "st_001_2", time: "13:30", label: "01:30 PM", availability: "low" }] },
    { id: "th_002", name: "INOX Leisure", address: "Magarpatta City", format: "4DX", showtimes: [{ id: "st_002_1", time: "09:30", label: "09:30 AM", availability: "high" }] }
  ];

  const batch = writeBatch(firestore);

  // Add movies
  for (const movie of MOCK_MOVIES) {
    const movieRef = doc(firestore, 'movies', movie.id);
    batch.set(movieRef, movie);
  }

  // Add theaters
  for (const theater of MOCK_THEATERS) {
    const theaterRef = doc(firestore, 'theaters', theater.id);
    batch.set(theaterRef, theater);
  }

  await batch.commit();
  console.log('[db] Database seeded automatically.');
}

export const PRICING = {
  premium: 350,
  standard: 250,
  economy: 150
};

// ═══════════════════════════════════════════════════════════════
//  PUBLIC SERVICE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export async function trackUserLogin(user) {
  try {
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
      loginCount: increment(1)
    }, { merge: true });
    
    const snap = await getDoc(userRef);
    if (snap.exists()) return snap.data();
  } catch (error) {
    console.error('[db] Error tracking user login:', error);
  }
  return null;
}

// ─── Role & User Management (Admin / Client) ─────────────────────────

export async function getUserRole(uid) {
  try {
    const roleRef = doc(firestore, 'user_roles', uid);
    const snap = await getDoc(roleRef);
    if (snap.exists()) {
      return snap.data().role;
    }
  } catch (error) {
    console.error('[db] Error fetching user role:', error);
  }
  return 'user'; // Default role
}

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (error) {
    console.error('[db] Error fetching all users:', error);
    return [];
  }
}

export async function grantClientAccess(targetUid) {
  try {
    const roleRef = doc(firestore, 'user_roles', targetUid);
    await setDoc(roleRef, {
      role: 'client',
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[db] Error granting client access:', error);
    throw error;
  }
}

export async function grantAdminAccess(targetUid) {
  try {
    const roleRef = doc(firestore, 'user_roles', targetUid);
    await setDoc(roleRef, {
      role: 'admin',
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[db] Error granting admin access:', error);
    throw error;
  }
}

// ─── Client Portal Helpers ─────────────────────────

export async function createMovie(movieData) {
  try {
    const moviesRef = collection(firestore, 'movies');
    const newMovieRef = doc(moviesRef);
    await setDoc(newMovieRef, {
      ...movieData,
      createdAt: serverTimestamp()
    });
    return newMovieRef.id;
  } catch (error) {
    console.error('[db] Error creating movie:', error);
    throw error;
  }
}

export async function updateMovie(movieId, movieData) {
  try {
    const movieRef = doc(firestore, 'movies', movieId);
    await setDoc(movieRef, {
      ...movieData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[db] Error updating movie:', error);
    throw error;
  }
}

export async function createTheater(theaterData) {
  try {
    const theatersRef = collection(firestore, 'theaters');
    const newTheaterRef = doc(theatersRef);
    await setDoc(newTheaterRef, {
      ...theaterData,
      createdAt: serverTimestamp()
    });
    return newTheaterRef.id;
  } catch (error) {
    console.error('[db] Error creating theater:', error);
    throw error;
  }
}

export async function createScreen(theaterId, screenData) {
  try {
    const screensRef = collection(firestore, `theaters/${theaterId}/screens`);
    const newScreenRef = doc(screensRef);
    await setDoc(newScreenRef, {
      ...screenData,
      createdAt: serverTimestamp()
    });
    return { id: newScreenRef.id, ...screenData };
  } catch (error) {
    console.error('[db] Error creating screen:', error);
    throw error;
  }
}

export async function createShowtime(showtimeData) {
  try {
    const showtimesRef = collection(firestore, 'showtimes');
    const newShowtimeRef = doc(showtimesRef);
    await setDoc(newShowtimeRef, {
      ...showtimeData,
      createdAt: serverTimestamp()
    });
    return newShowtimeRef.id;
  } catch (error) {
    console.error('[db] Error creating showtime:', error);
    throw error;
  }
}

export async function getMovies() {
  let snapshot = await getDocs(collection(firestore, 'movies'));
  if (snapshot.empty) {
    console.log('[db] No movies found. Implicitly seeding database...');
    await seedDatabase();
    // Fetch again after seeding
    snapshot = await getDocs(collection(firestore, 'movies'));
  }
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getScreens(theaterId) {
  try {
    const screensRef = collection(firestore, `theaters/${theaterId}/screens`);
    const snapshot = await getDocs(screensRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[db] Error fetching screens:', error);
    return [];
  }
}

export async function getTheaters(movieId = null) {
  try {
    if (!movieId) {
      // If no movieId, just return all theaters (used for admin/client dropdowns)
      const snapshot = await getDocs(collection(firestore, 'theaters'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // 1. Fetch showtimes for this movie
    const showtimesRef = collection(firestore, 'showtimes');
    const q = query(showtimesRef, where("movieId", "==", movieId));
    const stSnap = await getDocs(q);
    const showtimes = stSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Extract unique theater IDs
    const theaterIds = [...new Set(showtimes.map(st => st.theaterId))];
    
    if (theaterIds.length === 0) return [];

    // 3. Fetch theater documents and nest showtimes
    const theatersData = [];
    await Promise.all(theaterIds.map(async (tId) => {
      const tSnap = await getDoc(doc(firestore, 'theaters', tId));
      if (tSnap.exists()) {
        const theater = { id: tSnap.id, ...tSnap.data() };
        
        // Attach showtimes belonging to this theater
        theater.showtimes = showtimes.filter(st => st.theaterId === tId)
          .map(st => {
             // Convert 24h time to 12h AM/PM label
             let [hour, minute] = st.time.split(':');
             let ampm = hour >= 12 ? 'PM' : 'AM';
             hour = hour % 12;
             hour = hour ? hour : 12; // the hour '0' should be '12'
             
             return {
              id: st.id,
              date: st.date || "2026-05-10", // fallback for mock
              time: st.time,
              label: `${hour}:${minute} ${ampm}`,
              price: st.price,
              screenId: st.screenId,
              screenName: st.screenName,
              rows: st.rows,
              cols: st.cols,
              availability: "high"
             };
          })
          .sort((a,b) => a.time.localeCompare(b.time));
          
        theatersData.push(theater);
      }
    }));
    return theatersData;
  } catch (error) {
    console.error('[db] Error fetching theaters for movie:', error);
    return [];
  }
}

export async function getShowtimesForScreen(screenId, date) {
  try {
    const showtimesRef = collection(firestore, 'showtimes');
    const q = query(showtimesRef, where("screenId", "==", screenId), where("date", "==", date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[db] Error fetching showtimes for screen:', error);
    return [];
  }
}

export async function getAllShowtimes() {
  try {
    const showtimesRef = collection(firestore, 'showtimes');
    const snapshot = await getDocs(showtimesRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[db] Error fetching all showtimes:', error);
    return [];
  }
}

export async function deleteShowtime(showtimeId) {
  try {
    await deleteDoc(doc(firestore, 'showtimes', showtimeId));
    return true;
  } catch (error) {
    console.error('[db] Error deleting showtime:', error);
    throw error;
  }
}

// ─── Real-Time Seat Synchronization ─────────────────────────

let activeUnsubscribe = null;

export function listenToSeats(movieId, showtimeId, currentUserId, callback) {
  if (activeUnsubscribe) {
    activeUnsubscribe();
  }

  const seatsRef = collection(firestore, `movies/${movieId}/showtimes/${showtimeId}/seats`);
  
  activeUnsubscribe = onSnapshot(seatsRef, (snapshot) => {
    const seatsData = {};
    const now = Date.now();

    snapshot.forEach(docSnap => {
      const seat = docSnap.data();
      const seatId = docSnap.id;
      
      if (seat.status === 'booked') {
        seatsData[seatId] = 'booked';
      } else if (seat.status === 'pending') {
        const createdAt = seat.createdAt ? seat.createdAt.toMillis() : now;
        const ageInSeconds = (now - createdAt) / 1000;
        
        // TTL Garbage Collection: Ignore pending seats older than 120s
        if (ageInSeconds > 120) {
          seatsData[seatId] = 'available';
          // Collaborative Garbage Collection: proactively delete the expired seat 
          // because Firestore TTL policies can take up to 72 hours to physically remove it.
          deleteDoc(docSnap.ref).catch(() => {});
        } else {
          // It's still valid
          if (seat.userId === currentUserId) {
            seatsData[seatId] = 'selected';
          } else {
            seatsData[seatId] = 'pending'; // Someone else holds it
          }
        }
      }
    });

    callback(seatsData);
  }, (error) => {
    console.error("Seat listener error:", error);
  });

  return activeUnsubscribe;
}

export async function toggleSeatStatus(movieId, showtimeId, seatId, userId, newStatus) {
  const seatRef = doc(firestore, `movies/${movieId}/showtimes/${showtimeId}/seats`, seatId);
  
  if (newStatus === 'pending') {
    const expiresAt = new Date(Date.now() + 120000); // 120s TTL for Firestore GC
    await setDoc(seatRef, {
      status: 'pending',
      userId: userId,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt
    });
  } else if (newStatus === 'available') {
    await deleteDoc(seatRef);
  }
}

export async function clearPendingSeats(movieId, showtimeId, userId) {
  try {
    const seatsRef = collection(firestore, `movies/${movieId}/showtimes/${showtimeId}/seats`);
    const q = query(seatsRef, where('userId', '==', userId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(firestore);
    snapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error clearing pending seats:", error);
  }
}

// ─────────────────────────────────────────────────────────────

export async function saveBooking(bookingData) {
  const { movieId, showtimeId, seats, userId } = bookingData;
  const confirmationId = `BMS-${Date.now().toString(36).toUpperCase()}`;
  
  // Pre-Validation: Ensure the user still owns these pending seats before confirming
  for (const seatId of seats) {
    const seatRef = doc(firestore, `movies/${movieId}/showtimes/${showtimeId}/seats`, seatId);
    const snap = await getDoc(seatRef);
    if (snap.exists()) {
      const seatData = snap.data();
      if (seatData.status !== 'pending' || seatData.userId !== userId) {
        throw new Error(`Seat ${seatId} is no longer available. Please select again.`);
      }
      const now = Date.now();
      const createdAt = seatData.createdAt ? seatData.createdAt.toMillis() : now;
      if ((now - createdAt) > 120000) {
        throw new Error(`Reservation for seat ${seatId} has expired.`);
      }
    } else {
      throw new Error(`Seat ${seatId} was not properly reserved.`);
    }
  }

  const batch = writeBatch(firestore);

  // 1. Create booking record
  const bookingRef = doc(collection(firestore, 'bookings'));
  batch.set(bookingRef, {
    ...bookingData,
    status: 'confirmed',
    confirmationId,
    createdAt: serverTimestamp()
  });

  // 2. Mark all seats as booked permanently
  seats.forEach(seatId => {
    const seatRef = doc(firestore, `movies/${movieId}/showtimes/${showtimeId}/seats`, seatId);
    batch.set(seatRef, {
      status: 'booked',
      userId: userId,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();
  return confirmationId;
}

export async function sendConfirmationEmail(userEmail, bookingDetails) {
  const templateParams = {
    to_email: userEmail,
    movie_title: bookingDetails.movieTitle,
    theater_name: bookingDetails.theaterName,
    showtime: bookingDetails.showtime,
    seats: bookingDetails.seats.join(", "),
    total_price: `₹${bookingDetails.totalPrice}`,
    confirmation_id: bookingDetails.confirmationId
  };

  try {
    // Ensure EmailJS SDK is loaded in index.html
    await emailjs.send(
      "service_4oqvg88",
      "template_q5vuglu",
      templateParams,
      "L03Pzrso6fJbpdziq"
    );
    console.log('[db] Confirmation email sent to', userEmail);
  } catch (error) {
    console.error('[db] Failed to send confirmation email:', error);
  }
}

export async function cancelBooking(confirmationId) {
  try {
    const q = query(collection(firestore, 'bookings'), where('confirmationId', '==', confirmationId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const docSnap = snapshot.docs[0];
    const bookingData = docSnap.data();
    
    const batch = writeBatch(firestore);
    batch.delete(docSnap.ref);

    bookingData.seats.forEach(seatId => {
      const seatRef = doc(firestore, `movies/${bookingData.movieId}/showtimes/${bookingData.showtimeId}/seats`, seatId);
      batch.delete(seatRef);
    });

    await batch.commit();
    console.log('[db] Booking canceled successfully:', confirmationId);
  } catch (error) {
    console.error('[db] Error canceling booking:', error);
    throw error;
  }
}

export async function getUserBookings(userId) {
  try {
    const q = query(collection(firestore, 'bookings'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
}

// ─── Auto-Schedule Showtimes ──────────────────────────────────────────────────
// Given a movieId, randomly picks 2-3 theaters, 1-2 screens each,
// and creates showtimes for the next 7 days at varied times.
export async function autoScheduleShowtimes(movieId, ownerId) {
  const TIME_POOLS = [
    ['10:00', '13:30', '17:00', '20:30'],
    ['09:30', '13:00', '16:30', '20:00'],
    ['10:30', '14:00', '18:30', '22:00'],
    ['11:00', '15:00', '19:00'],
  ];
  const PRICES = [220, 250, 280, 320, 350, 400];

  // Get all theaters
  const theaterSnap = await getDocs(collection(firestore, 'theaters'));
  const theaters = theaterSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (theaters.length === 0) throw new Error('No theaters found. Add theaters first.');

  // Pick 2-3 random theaters (or all if fewer)
  const shuffledTheaters = [...theaters].sort(() => Math.random() - 0.5);
  const pickedTheaters = shuffledTheaters.slice(0, Math.min(3, theaters.length));

  // Build date list for next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const batch = writeBatch(firestore);
  let count = 0;

  for (const theater of pickedTheaters) {
    // Get screens for this theater
    const screenSnap = await getDocs(collection(firestore, `theaters/${theater.id}/screens`));
    const screens = screenSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (screens.length === 0) continue;

    // Pick 1-2 random screens
    const pickedScreens = [...screens].sort(() => Math.random() - 0.5)
      .slice(0, Math.min(2, screens.length));

    const times = TIME_POOLS[Math.floor(Math.random() * TIME_POOLS.length)];
    const price = PRICES[Math.floor(Math.random() * PRICES.length)];

    for (const screen of pickedScreens) {
      for (const date of dates) {
        for (const time of times) {
          const ref = doc(collection(firestore, 'showtimes'));
          batch.set(ref, {
            movieId,
            theaterId: theater.id,
            screenId: screen.id,
            screenName: screen.name || 'Main Screen',
            rows: screen.rows || 10,
            cols: screen.cols || 12,
            date,
            time,
            price,
            ownerId,
            createdAt: serverTimestamp(),
          });
          count++;
        }
      }
    }
  }

  await batch.commit();
  return { theaters: pickedTheaters.length, showtimes: count };
}

