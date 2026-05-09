import { getMovies, getTheaters, getScreens, createMovie, updateMovie, createTheater, createScreen, createShowtime, getShowtimesForScreen, getAllShowtimes, deleteShowtime } from './db.js';

export async function renderClientPortal(container, onBack, user) {
  container.innerHTML = `
    <div class="portal client-portal glass-panel" style="padding: var(--space-xl); max-width: 800px; margin: 0 auto; border-radius: 12px; margin-top: var(--space-xl);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
        <h2 style="font-family: 'Share Tech Mono', monospace; font-size: 24px; color: var(--clr-accent);">CLIENT PORTAL</h2>
        <button id="client-back-btn" class="btn-ghost">Back to Dashboard</button>
      </div>

      <!-- TAB NAVIGATION -->
      <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-xl); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; overflow-x: auto;">
        <button id="tab-movie" style="background: none; border: none; color: var(--clr-accent); border-bottom: 2px solid var(--clr-accent); padding-bottom: 8px; font-size: 14px; cursor: pointer; transition: color 0.2s;">Movie Builder</button>
        <button id="tab-theater" style="background: none; border: none; color: var(--clr-text-dim); border-bottom: 2px solid transparent; padding-bottom: 8px; font-size: 14px; cursor: pointer; transition: color 0.2s;">Theater Builder</button>
        <button id="tab-showtime" style="background: none; border: none; color: var(--clr-text-dim); border-bottom: 2px solid transparent; padding-bottom: 8px; font-size: 14px; cursor: pointer; transition: color 0.2s;">Showtime Scheduler</button>
        <button id="tab-manage" style="background: none; border: none; color: var(--clr-text-dim); border-bottom: 2px solid transparent; padding-bottom: 8px; font-size: 14px; cursor: pointer; transition: color 0.2s;">Manage Showtimes</button>
      </div>

      <!-- MOVIE BUILDER TAB -->
      <div id="section-movie-builder">
        <!-- Edit Existing or Create New -->
        <div style="margin-bottom: var(--space-xl); padding-bottom: var(--space-xl); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md);">
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Edit Existing Movie (Optional)</label>
              <select id="edit-movie-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
                <option value="">-- Create New Movie --</option>
              </select>
            </div>
          </div>
          <div style="display: grid; gap: var(--space-md); margin-bottom: var(--space-md);">
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Movie Title</label>
              <input type="text" id="movie-title" placeholder="e.g. Inception" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
          <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md);">
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Genre</label>
              <input type="text" id="movie-genre" placeholder="e.g. Sci-Fi, Action" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Duration</label>
              <input type="text" id="movie-duration" placeholder="e.g. 2h 18m" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
          <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md);">
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Language</label>
              <input type="text" id="movie-language" placeholder="e.g. English" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Format</label>
              <input type="text" id="movie-format" placeholder="e.g. IMAX 3D" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Rating</label>
              <input type="text" id="movie-rating" placeholder="e.g. 8.9" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
          <div style="margin-bottom: var(--space-md);">
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Poster Source</label>
            <div style="display:flex; gap: 8px; margin-bottom: 8px;">
              <input type="text" id="movie-poster-url" placeholder="Paste image URL here..." style="flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <button id="load-url-btn" class="btn-ghost" style="padding: 0 16px;">Load URL</button>
            </div>
            <div style="display:flex; align-items:center; gap: 8px;">
              <span style="font-size: 12px; color: var(--clr-text-dim);">OR Upload File:</span>
              <input type="file" id="movie-poster-file" accept="image/*" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            
            <input type="hidden" id="movie-poster-original" value="">
            <input type="hidden" id="movie-poster-crop" value="{}">
            
            <div id="poster-preview-container" style="display:none; margin-top:12px; width: 150px; height: 225px; border-radius: 8px; overflow: hidden; position: relative; border: 1px solid var(--clr-border);">
              <img id="poster-preview-img" style="position: absolute; transform-origin: top left;" />
            </div>
            <button id="re-crop-btn" class="btn-ghost" style="display:none; margin-top: 8px; font-size: 12px;">Adjust Crop</button>
          </div>
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Synopsis</label>
            <textarea id="movie-synopsis" rows="3" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;"></textarea>
          </div>
        </div>
        <button id="save-movie-btn" class="btn-primary" style="width: 100%;">Save Movie</button>
      </div>

      <!-- THEATER BUILDER TAB -->
      <div id="section-theater-builder" style="display: none;">
        <!-- Create Theater -->
        <div style="margin-bottom: var(--space-xl); padding-bottom: var(--space-xl); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h3 style="font-family: var(--font-serif); font-size: 20px; margin-bottom: var(--space-md);">1. Create Theater</h3>
          <div style="display: grid; gap: var(--space-md); margin-bottom: var(--space-md);">
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Theater Name</label>
              <input type="text" id="theater-name" placeholder="e.g. PVR Phoenix" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Address / Location</label>
              <input type="text" id="theater-address" placeholder="e.g. Viman Nagar, Pune" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Format</label>
              <input type="text" id="theater-format" placeholder="e.g. IMAX / 4DX" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
          <button id="save-theater-btn" class="btn-ghost" style="width: 100%;">Create Theater</button>
        </div>

        <!-- Add Screen to Theater -->
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 20px; margin-bottom: var(--space-md);">2. Add Screen to Theater</h3>
          <div style="display: grid; gap: var(--space-md); margin-bottom: var(--space-lg);">
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Select Theater</label>
              <select id="screen-theater-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
                <option value="">Loading theaters...</option>
              </select>
            </div>
            <div>
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Screen Name</label>
              <input type="text" id="screen-name" placeholder="e.g. Screen 1" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="display: flex; gap: var(--space-md);">
              <div style="flex: 1;">
                <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Rows</label>
                <input type="number" id="screen-rows" value="10" min="1" max="26" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              </div>
              <div style="flex: 1;">
                <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Columns</label>
                <input type="number" id="screen-cols" value="15" min="1" max="50" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              </div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-lg); border: 1px dashed rgba(255,255,255,0.2); padding: var(--space-md); border-radius: 8px; text-align: center; overflow-x: auto;">
            <h3 style="font-family: 'Share Tech Mono', monospace; font-size: 14px; margin-bottom: var(--space-md);">LIVE PREVIEW</h3>
            <div id="screen-preview" style="display: inline-flex; flex-direction: column; gap: 4px;"></div>
          </div>

          <button id="save-screen-btn" class="btn-primary" style="width: 100%;">Save Screen</button>
        </div>
      </div>

      <!-- SHOWTIME SCHEDULER TAB -->
      <div id="section-showtime-scheduler" style="display: none;">
         <div style="display: grid; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Select Movie</label>
            <select id="show-movie-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option value="">Loading movies...</option>
            </select>
          </div>
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Select Theater</label>
            <select id="show-theater-select2" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option value="">Loading theaters...</option>
            </select>
          </div>
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Select Screen</label>
            <select id="show-screen-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option value="">-- Select Theater First --</option>
            </select>
          </div>
          <div style="display: flex; gap: var(--space-md);">
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Dates (comma-separated)</label>
              <input type="text" id="show-date" placeholder="e.g. 2026-05-10, 2026-05-11" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Start Times (comma-separated)</label>
              <input type="text" id="show-time" placeholder="e.g. 10:00, 14:00, 18:00" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Ticket Price (₹)</label>
              <input type="number" id="show-price" value="250" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
        </div>
        <button id="save-showtime-btn" class="btn-primary" style="width: 100%;">Schedule Showtime(s)</button>
      </div>
    </div>

    <!-- MANAGE SHOWTIMES TAB -->
    <div id="section-manage-showtimes" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <h3 style="font-family: var(--font-serif); font-size: 20px;">Manage Showtimes</h3>
        <button id="bulk-delete-btn" style="display: none; background: rgba(255,49,49,0.1); border: 1px solid rgba(255,49,49,0.4); color: #FF3131; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;">Delete Selected (<span id="bulk-count">0</span>)</button>
      </div>
      <div id="manage-showtimes-list" style="display: flex; flex-direction: column; gap: 8px;">
        <p style="color:var(--clr-text-dim);">Loading showtimes...</p>
      </div>
    </div>

    <!-- CROPPER MODAL -->
    <div id="cropper-modal" class="hidden" style="position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); backdrop-filter: blur(10px);">
      <div style="width: 90%; max-width: 500px; height: 60vh; background: #000; border: 1px solid var(--clr-border); border-radius: 12px; overflow:hidden;">
        <img id="cropper-img" style="max-width: 100%; display:block;">
      </div>
      <div style="margin-top:var(--space-md); display:flex; gap:var(--space-md);">
        <button id="cropper-cancel-btn" class="btn-ghost">Cancel</button>
        <button id="cropper-save-btn" class="btn-primary">Crop & Save</button>
      </div>
    </div>
  `;

  // Bind Back Button
  document.getElementById('client-back-btn').addEventListener('click', onBack);

  // Bind Tabs
  const tabMovie = document.getElementById('tab-movie');
  const tabTheater = document.getElementById('tab-theater');
  const tabShowtime = document.getElementById('tab-showtime');
  const tabManage = document.getElementById('tab-manage');
  const sectionMovie = document.getElementById('section-movie-builder');
  const sectionTheater = document.getElementById('section-theater-builder');
  const sectionShowtime = document.getElementById('section-showtime-scheduler');
  const sectionManageShowtimes = document.getElementById('section-manage-showtimes');

  const selectTab = (activeTab, activeSection) => {
    [tabMovie, tabTheater, tabShowtime, tabManage].forEach(t => {
      t.style.color = 'var(--clr-text-dim)';
      t.style.borderBottom = '2px solid transparent';
    });
    [sectionMovie, sectionTheater, sectionShowtime, sectionManageShowtimes].forEach(s => {
      s.style.display = 'none';
    });

    activeTab.style.color = 'var(--clr-accent)';
    activeTab.style.borderBottom = '2px solid var(--clr-accent)';
    activeSection.style.display = 'block';
  };

  tabMovie.addEventListener('click', () => selectTab(tabMovie, sectionMovie));
  tabTheater.addEventListener('click', () => selectTab(tabTheater, sectionTheater));
  tabShowtime.addEventListener('click', () => selectTab(tabShowtime, sectionShowtime));
  tabManage.addEventListener('click', () => {
    selectTab(tabManage, sectionManageShowtimes);
    refreshShowtimesTable();
  });

  // Load Data
  let movies = [];
  let theaters = [];
  let currentScreens = []; // holds screens for the currently selected theater in the scheduler

  async function refreshDropdowns() {
    try {
      [movies, theaters] = await Promise.all([getMovies(), getTheaters()]);
      
      const tSelects = [document.getElementById('screen-theater-select'), document.getElementById('show-theater-select2')];
      tSelects.forEach(sel => {
        sel.innerHTML = '<option value="">-- Select Theater --</option>' + 
          theaters.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      });

      const mSelect = document.getElementById('show-movie-select');
      const movieOptions = movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
      
      mSelect.innerHTML = '<option value="">-- Select Movie --</option>' + movieOptions;
      
      const editMSelect = document.getElementById('edit-movie-select');
      if (editMSelect) {
        editMSelect.innerHTML = '<option value="">-- Create New Movie --</option>' + movieOptions;
      }
        
    } catch (e) {
      console.error("Error loading data for Client Portal", e);
    }
  }

  async function refreshShowtimesTable() {
    const listContainer = document.getElementById('manage-showtimes-list');
    listContainer.innerHTML = '<p style="color:var(--clr-text-dim);">Loading...</p>';
    try {
      const allShowtimes = await getAllShowtimes();
      if (allShowtimes.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--clr-text-dim);">No showtimes found.</p>';
        return;
      }
      
      // Attach movie titles and sort
      allShowtimes.forEach(st => {
        const m = movies.find(m => m.id === st.movieId);
        st.movieTitle = m ? m.title : 'Unknown Movie';
      });
      
      allShowtimes.sort((a, b) => {
        if (a.movieTitle !== b.movieTitle) return a.movieTitle.localeCompare(b.movieTitle);
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      // Deep Grouping: Movie -> Theater -> Screen -> Date
      const grouped = {};
      allShowtimes.forEach(st => {
        const t = theaters.find(th => th.id === st.theaterId);
        st.theaterName = t ? t.name : 'Unknown Theater';

        if (!grouped[st.movieTitle]) grouped[st.movieTitle] = { count: 0, theaters: {} };
        grouped[st.movieTitle].count++;
        
        const mGroup = grouped[st.movieTitle].theaters;
        if (!mGroup[st.theaterName]) mGroup[st.theaterName] = {};
        
        const tGroup = mGroup[st.theaterName];
        if (!tGroup[st.screenName]) tGroup[st.screenName] = {};

        const sGroup = tGroup[st.screenName];
        if (!sGroup[st.date]) sGroup[st.date] = [];

        sGroup[st.date].push(st);
      });

      listContainer.innerHTML = Object.entries(grouped).map(([movieTitle, movieData]) => `
        <div style="margin-bottom: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--clr-border); border-radius: 8px; overflow: hidden;">
          <button class="accordion-header" style="width: 100%; text-align: left; padding: 16px; font-size: 16px; font-weight: 600; color: var(--clr-text); display: flex; justify-content: space-between; align-items: center; border: none; background: transparent; cursor: pointer;">
            <span><span style="color: var(--clr-accent);">${movieTitle}</span> <span style="font-size: 13px; color: var(--clr-text-dim); font-weight: 400; margin-left: 8px;">(${movieData.count} shows)</span></span>
            <span class="accordion-icon" style="transition: transform 0.2s; font-size: 12px; color: var(--clr-text-dim);">▼</span>
          </button>
          <div class="accordion-content" style="display: none; padding: 0 16px 16px 16px; flex-direction: column; gap: 16px;">
            ${Object.entries(movieData.theaters).map(([theaterName, screens]) => `
              <div>
                <h4 style="font-size: 14px; color: var(--clr-text); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">${theaterName}</h4>
                <div style="margin-left: 12px; display: flex; flex-direction: column; gap: 12px;">
                  ${Object.entries(screens).map(([screenName, dates]) => `
                    <div>
                      <h5 style="font-size: 13px; color: var(--clr-text-dim); margin-bottom: 6px;">${screenName}</h5>
                      <div style="margin-left: 12px; display: flex; flex-direction: column; gap: 8px;">
                        ${Object.entries(dates).map(([date, shows]) => `
                          <div>
                            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #aaa;">${date}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                              ${shows.map(st => `
                                <label class="st-chip" data-id="${st.id}" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); padding: 5px 10px; border-radius: 4px; display: flex; align-items: center; gap: 7px; cursor: pointer; user-select: none; transition: background 0.15s, border-color 0.15s;">
                                  <input type="checkbox" class="st-checkbox" data-id="${st.id}" style="accent-color: #FF3131; width: 13px; height: 13px; cursor: pointer;">
                                  <span style="font-size: 12px; font-family: var(--font-mono);">${st.time} (₹${st.price})</span>
                                </label>
                              `).join('')}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      // Bind accordion toggles
      document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', (e) => {
          const content = e.currentTarget.nextElementSibling;
          const icon = e.currentTarget.querySelector('.accordion-icon');
          const isExpanded = content.style.display === 'flex';
          
          // Close all others (optional accordion logic)
          /*
          document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');
          document.querySelectorAll('.accordion-icon').forEach(i => i.style.transform = 'rotate(0deg)');
          */

          if (isExpanded) {
            content.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
          } else {
            content.style.display = 'flex';
            icon.style.transform = 'rotate(180deg)';
          }
        });
      });

      // Multi-select chip logic
      const bulkBtn = document.getElementById('bulk-delete-btn');
      const bulkCount = document.getElementById('bulk-count');

      const updateBulkBar = () => {
        const selected = document.querySelectorAll('.st-checkbox:checked');
        if (selected.length > 0) {
          bulkBtn.style.display = 'block';
          bulkCount.textContent = selected.length;
        } else {
          bulkBtn.style.display = 'none';
        }
      };

      document.querySelectorAll('.st-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          // Prevent double-toggle when clicking the checkbox directly
          if (e.target.type === 'checkbox') return;
          const cb = chip.querySelector('.st-checkbox');
          cb.checked = !cb.checked;
          chip.style.background = cb.checked ? 'rgba(255,49,49,0.15)' : 'rgba(255,255,255,0.05)';
          chip.style.borderColor = cb.checked ? 'rgba(255,49,49,0.5)' : 'rgba(255,255,255,0.15)';
          updateBulkBar();
        });
        chip.querySelector('.st-checkbox').addEventListener('change', (e) => {
          chip.style.background = e.target.checked ? 'rgba(255,49,49,0.15)' : 'rgba(255,255,255,0.05)';
          chip.style.borderColor = e.target.checked ? 'rgba(255,49,49,0.5)' : 'rgba(255,255,255,0.15)';
          updateBulkBar();
        });
      });

      bulkBtn.addEventListener('click', async () => {
        const selected = [...document.querySelectorAll('.st-checkbox:checked')];
        if (!selected.length) return;
        if (!confirm(`Delete ${selected.length} showtime(s)?`)) return;
        bulkBtn.disabled = true;
        bulkBtn.textContent = 'Deleting...';
        try {
          await Promise.all(selected.map(cb => deleteShowtime(cb.dataset.id)));
          await refreshShowtimesTable();
        } catch (err) {
          alert('Failed to delete some showtimes.');
          bulkBtn.disabled = false;
        }
      });
    } catch (e) {
      listContainer.innerHTML = '<p style="color:#FF3131;">Failed to load showtimes.</p>';
    }
  }

  await refreshDropdowns();

  // Initialize Flatpickr
  if (window.flatpickr) {
    flatpickr("#show-date", {
      mode: "multiple",
      dateFormat: "Y-m-d",
      minDate: "today"
    });
  }

  // Cascade Dropdown: Load screens when a theater is selected in Showtime Scheduler
  const showTheaterSelect2 = document.getElementById('show-theater-select2');
  const showScreenSelect = document.getElementById('show-screen-select');
  showTheaterSelect2.addEventListener('change', async (e) => {
    const theaterId = e.target.value;
    if (!theaterId) {
      showScreenSelect.innerHTML = '<option value="">-- Select Theater First --</option>';
      return;
    }
    showScreenSelect.innerHTML = '<option value="">Loading screens...</option>';
    try {
      currentScreens = await getScreens(theaterId);
      if (currentScreens.length === 0) {
        showScreenSelect.innerHTML = '<option value="">No screens found. Create one first.</option>';
      } else {
        showScreenSelect.innerHTML = '<option value="">-- Select Screen --</option>' +
          currentScreens.map(s => `<option value="${s.id}">${s.name} (${s.rows}x${s.cols})</option>`).join('');
      }
    } catch (error) {
      showScreenSelect.innerHTML = '<option value="">Error loading screens</option>';
    }
  });


  // ─── CROPPER LOGIC ──────────────────────────────────────────
  let cropper = null;
  const urlInput = document.getElementById('movie-poster-url');
  const loadUrlBtn = document.getElementById('load-url-btn');
  const fileInput = document.getElementById('movie-poster-file');
  const cropperModal = document.getElementById('cropper-modal');
  const cropperImg = document.getElementById('cropper-img');
  const cancelBtn = document.getElementById('cropper-cancel-btn');
  const saveCropBtn = document.getElementById('cropper-save-btn');
  
  const originalInput = document.getElementById('movie-poster-original');
  const cropInput = document.getElementById('movie-poster-crop');
  const previewImg = document.getElementById('poster-preview-img');
  const posterPreviewContainer = document.getElementById('poster-preview-container');
  const reCropBtn = document.getElementById('re-crop-btn');

  function openCropper(imageSrc, previousCropData = null) {
    cropperImg.src = imageSrc;
    cropperModal.classList.remove('hidden');
    
    if (cropper) cropper.destroy();
    
    // We must wait for the image to load before initializing Cropper
    cropperImg.onload = () => {
      cropper = new Cropper(cropperImg, {
        aspectRatio: 2 / 3,
        viewMode: 1,
        autoCropArea: 1,
        ready() {
          if (previousCropData) {
            cropper.setData(previousCropData);
          }
        }
      });
    };
  }

  loadUrlBtn.addEventListener('click', () => {
    if (urlInput.value) openCropper(urlInput.value);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Lightly compress large files to avoid Firestore 1MB limits
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1920;
        
        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        openCropper(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  reCropBtn.addEventListener('click', () => {
    if (originalInput.value && cropInput.value) {
      openCropper(originalInput.value, JSON.parse(cropInput.value));
    }
  });

  cancelBtn.addEventListener('click', () => {
    cropperModal.classList.add('hidden');
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });

  saveCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // 1. Get mathematical crop data
    const cropData = cropper.getData(true);
    cropData.naturalWidth = cropperImg.naturalWidth;
    cropData.naturalHeight = cropperImg.naturalHeight;
    
    // 2. Save original source and crop data to hidden inputs
    originalInput.value = cropperImg.src;
    cropInput.value = JSON.stringify(cropData);
    
    // 3. Render CSS preview
    previewImg.src = cropperImg.src;
    const previewWidth = 150; // from CSS
    const scale = previewWidth / cropData.width;
    
    previewImg.style.width = `${cropperImg.naturalWidth * scale}px`;
    previewImg.style.height = `${cropperImg.naturalHeight * scale}px`;
    previewImg.style.left = `-${cropData.x * scale}px`;
    previewImg.style.top = `-${cropData.y * scale}px`;
    
    posterPreviewContainer.style.display = 'block';
    reCropBtn.style.display = 'inline-block';

    // Cleanup
    cropperModal.classList.add('hidden');
    cropper.destroy();
    cropper = null;
  });
  // ────────────────────────────────────────────────────────────
  const rowsInput = document.getElementById('screen-rows');
  const colsInput = document.getElementById('screen-cols');
  const previewContainer = document.getElementById('screen-preview');

  function renderPreview() {
    const rows = parseInt(rowsInput.value) || 0;
    const cols = parseInt(colsInput.value) || 0;
    
    let html = '';
    for(let r=0; r<rows; r++) {
      html += '<div style="display:flex; gap:4px; justify-content:center;">';
      for(let c=0; c<cols; c++) {
        html += '<div style="width:16px; height:16px; background:rgba(255,255,255,0.2); border-radius:4px;"></div>';
      }
      html += '</div>';
    }
    previewContainer.innerHTML = html;
  }

  rowsInput.addEventListener('input', renderPreview);
  colsInput.addEventListener('input', renderPreview);
  renderPreview(); // initial render

  // --- ACTIONS ---

  function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'nothing-loader';
    loader.id = 'client-portal-loader';
    document.body.appendChild(loader);
  }
  function hideLoader() {
    const loader = document.getElementById('client-portal-loader');
    if (loader) loader.remove();
  }

  // Edit Movie Select Logic
  const editMovieSelect = document.getElementById('edit-movie-select');
  editMovieSelect.addEventListener('change', (e) => {
    const movieId = e.target.value;
    const saveBtn = document.getElementById('save-movie-btn');
    if (!movieId) {
      // Clear form
      document.getElementById('movie-title').value = '';
      document.getElementById('movie-genre').value = '';
      document.getElementById('movie-duration').value = '';
      document.getElementById('movie-language').value = '';
      document.getElementById('movie-format').value = '';
      document.getElementById('movie-rating').value = '';
      document.getElementById('movie-synopsis').value = '';
      document.getElementById('movie-poster-original').value = '';
      document.getElementById('movie-poster-crop').value = '{}';
      document.getElementById('poster-preview-container').style.display = 'none';
      document.getElementById('re-crop-btn').style.display = 'none';
      saveBtn.textContent = 'Create Movie';
      return;
    }
    
    const movie = movies.find(m => m.id === movieId);
    if (movie) {
      document.getElementById('movie-title').value = movie.title || '';
      document.getElementById('movie-genre').value = movie.genre || '';
      document.getElementById('movie-duration').value = movie.duration || '';
      document.getElementById('movie-language').value = movie.language || '';
      document.getElementById('movie-format').value = movie.format || '';
      document.getElementById('movie-rating').value = movie.rating || '';
      document.getElementById('movie-synopsis').value = movie.synopsis || '';
      
      const pOrig = movie.posterOriginal || movie.poster || '';
      const pCrop = movie.posterCrop || {};
      
      document.getElementById('movie-poster-original').value = pOrig;
      document.getElementById('movie-poster-crop').value = JSON.stringify(pCrop);
      
      if (pOrig) {
        previewImg.src = pOrig;
        // If crop data exists, apply it to preview
        if (pCrop.width) {
          const previewWidth = 150;
          const scale = previewWidth / pCrop.width;
          previewImg.style.width = `${(pCrop.naturalWidth || 1000) * scale}px`; // Fallback naturalWidth if not stored, will fix on image load
          
          // Better way: let image load and apply natural width
          const tempImg = new Image();
          tempImg.onload = () => {
            previewImg.style.width = `${tempImg.width * scale}px`;
            previewImg.style.height = `${tempImg.height * scale}px`;
            previewImg.style.left = `-${pCrop.x * scale}px`;
            previewImg.style.top = `-${pCrop.y * scale}px`;
          };
          tempImg.src = pOrig;
        } else {
          previewImg.style.width = '100%';
          previewImg.style.height = '100%';
          previewImg.style.left = '0';
          previewImg.style.top = '0';
        }
        
        document.getElementById('poster-preview-container').style.display = 'block';
        document.getElementById('re-crop-btn').style.display = 'inline-block';
      }
      saveBtn.textContent = 'Update Movie';
    }
  });

  // Save Movie
  document.getElementById('save-movie-btn').addEventListener('click', async (e) => {
    const movieId = document.getElementById('edit-movie-select').value;
    const title = document.getElementById('movie-title').value;
    const genre = document.getElementById('movie-genre').value;
    const duration = document.getElementById('movie-duration').value;
    const language = document.getElementById('movie-language').value;
    const format = document.getElementById('movie-format').value;
    const rating = document.getElementById('movie-rating').value;
    const synopsis = document.getElementById('movie-synopsis').value;
    
    // New Image Architecture
    const posterOriginal = document.getElementById('movie-poster-original').value;
    let posterCrop = {};
    try {
      posterCrop = JSON.parse(document.getElementById('movie-poster-crop').value);
    } catch(err) {}

    // Fallback if no image uploaded
    const finalOriginal = posterOriginal || "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=80";

    if(!title || !genre || !duration || !language || !format || !rating || !synopsis) {
      return alert("Please fill all fields.");
    }

    e.target.disabled = true;
    e.target.textContent = movieId ? 'Updating...' : 'Creating...';
    showLoader();

    try {
      const payload = { 
        title, genre, duration, language, format, rating, synopsis,
        posterOriginal: finalOriginal,
        posterCrop 
      };

      if (movieId) {
        await updateMovie(movieId, payload);
        alert("Movie updated successfully!");
      } else {
        await createMovie(payload);
        alert("Movie created successfully!");
        // Clear form
        editMovieSelect.value = '';
        editMovieSelect.dispatchEvent(new Event('change'));
      }
      
      await refreshDropdowns();
    } catch(err) {
      alert("Failed to save movie.");
    } finally {
      e.target.disabled = false;
      e.target.textContent = movieId ? 'Update Movie' : 'Create Movie';
      hideLoader();
    }
  });

  // Save Theater
  document.getElementById('save-theater-btn').addEventListener('click', async (e) => {
    const name = document.getElementById('theater-name').value;
    const address = document.getElementById('theater-address').value;
    const format = document.getElementById('theater-format').value;

    if(!name || !address || !format) return alert("Please fill all theater fields.");

    // Check for uniqueness
    const nameLower = name.trim().toLowerCase();
    const isDuplicate = theaters.some(t => t.name.trim().toLowerCase() === nameLower);
    if (isDuplicate) {
      return alert("A theater with this name already exists. Please choose a unique name.");
    }

    e.target.disabled = true;
    e.target.textContent = 'Creating...';
    showLoader();

    try {
      await createTheater({ name, address, format, ownerId: user.uid });
      alert("Theater created successfully!");
      document.getElementById('theater-name').value = '';
      await refreshDropdowns();
    } catch(err) {
      alert("Failed to create theater.");
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Create Theater';
      hideLoader();
    }
  });

  // Save Screen
  document.getElementById('save-screen-btn').addEventListener('click', async (e) => {
    const theaterId = document.getElementById('screen-theater-select').value;
    const name = document.getElementById('screen-name').value;
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);

    if(!theaterId || !name || !rows || !cols) return alert("Please fill all screen fields.");

    e.target.disabled = true;
    e.target.textContent = 'Saving...';
    showLoader();

    try {
      await createScreen(theaterId, { name, rows, cols });
      alert("Screen added successfully!");
      document.getElementById('screen-name').value = '';
    } catch(err) {
      alert("Failed to create screen.");
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Save Screen';
      hideLoader();
    }
  });

  // Helper: parse "2h 30m" into 150
  function parseDurationToMinutes(durationStr) {
    if (!durationStr) return 120;
    const match = durationStr.match(/(\d+)h\s*(?:(\d+)m)?/i);
    if (match) {
      const h = parseInt(match[1]) || 0;
      const m = parseInt(match[2]) || 0;
      return (h * 60) + m;
    }
    const matchM = durationStr.match(/(\d+)\s*m/i);
    if (matchM) return parseInt(matchM[1]);
    return 120;
  }

  // Helper: parse "14:30" into 870
  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':');
    return (parseInt(h) * 60) + parseInt(m);
  }

  // Save Showtime
  document.getElementById('save-showtime-btn').addEventListener('click', async (e) => {
    const movieId = document.getElementById('show-movie-select').value;
    const theaterId = document.getElementById('show-theater-select2').value;
    const screenId = document.getElementById('show-screen-select').value;
    const datesRaw = document.getElementById('show-date').value;
    const timesRaw = document.getElementById('show-time').value;
    const price = parseInt(document.getElementById('show-price').value);

    if(!movieId || !theaterId || !screenId || !datesRaw || !timesRaw || !price) {
      return alert("Please fill all showtime fields.");
    }

    const movie = movies.find(m => m.id === movieId);
    const durationMins = parseDurationToMinutes(movie?.duration);
    const selectedScreen = currentScreens.find(s => s.id === screenId);

    const dates = datesRaw.split(',').map(d => d.trim()).filter(d => d);
    const times = timesRaw.split(',').map(t => t.trim()).filter(t => t);
    
    // Regex validation for dates (YYYY-MM-DD) and times (HH:MM)
    if (!dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) return alert("Dates must be in YYYY-MM-DD format.");
    if (!times.every(t => /^\d{2}:\d{2}$/.test(t))) return alert("Times must be in 24h HH:MM format.");

    e.target.disabled = true;
    e.target.textContent = 'Checking availability...';
    showLoader();

    try {
      // Create a list of new showtimes we want to schedule
      const newSchedules = [];
      for (const date of dates) {
        for (const time of times) {
          const startMins = timeToMinutes(time);
          const endMins = startMins + durationMins + 30; // 30 mins cleaning buffer
          newSchedules.push({ date, time, startMins, endMins });
        }
      }

      // Check for clashes
      for (const date of dates) {
        const existingShowtimes = await getShowtimesForScreen(screenId, date);
        const newForDate = newSchedules.filter(s => s.date === date);

        for (const newSt of newForDate) {
          for (const extSt of existingShowtimes) {
            // If existing doesn't have endMins (old data), assume 150 mins
            const extStart = timeToMinutes(extSt.time);
            const extEnd = extSt.endMins || (extStart + 150);

            // Overlap condition: startA < endB AND endA > startB
            if (newSt.startMins < extEnd && newSt.endMins > extStart) {
              alert(`Clash detected on ${date}!\nTime ${newSt.time} overlaps with existing showtime at ${extSt.time}.`);
              throw new Error("Clash detected");
            }
          }
        }
      }

      e.target.textContent = 'Scheduling...';
      
      // All clear! Batch create them.
      for (const sched of newSchedules) {
        await createShowtime({ 
          movieId, 
          theaterId, 
          screenId, 
          screenName: selectedScreen.name,
          rows: selectedScreen.rows,
          cols: selectedScreen.cols,
          date: sched.date,
          time: sched.time, 
          endMins: sched.endMins,
          price, 
          ownerId: user.uid 
        });
      }
      
      alert(`Successfully scheduled ${newSchedules.length} showtime(s)!`);
      document.getElementById('show-date').value = '';
      document.getElementById('show-time').value = '';
      await refreshShowtimesTable();

    } catch(err) {
      if (err.message !== "Clash detected") {
        console.error(err);
        alert("Failed to schedule showtimes.");
      }
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Schedule Showtime(s)';
      hideLoader();
    }
  });
}
