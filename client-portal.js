import { getMovies, getTheaters, createScreen, createShowtime } from './db.js';

export async function renderClientPortal(container, onBack, user) {
  container.innerHTML = `
    <div class="portal client-portal glass-panel" style="padding: var(--space-xl); max-width: 800px; margin: 0 auto; border-radius: 12px; margin-top: var(--space-xl);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
        <h2 style="font-family: 'Share Tech Mono', monospace; font-size: 24px; color: var(--clr-primary);">CLIENT PORTAL</h2>
        <button id="client-back-btn" class="btn-ghost">Back to Dashboard</button>
      </div>

      <!-- TAB NAVIGATION -->
      <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-xl); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <button id="tab-screen" class="btn-ghost" style="color: var(--clr-primary); border-bottom: 2px solid var(--clr-primary);">Screen Builder</button>
        <button id="tab-showtime" class="btn-ghost" style="color: var(--clr-text-dim);">Showtime Scheduler</button>
      </div>

      <!-- SCREEN BUILDER TAB -->
      <div id="section-screen-builder">
        <div style="display: grid; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Select Theater</label>
            <select id="screen-theater-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option value="">Loading theaters...</option>
            </select>
          </div>
          <div>
            <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Screen Name</label>
            <input type="text" id="screen-name" placeholder="e.g. Screen 1 - IMAX" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
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

      <!-- SHOWTIME SCHEDULER TAB (Hidden by default) -->
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
            <select id="show-theater-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option value="">Loading theaters...</option>
            </select>
          </div>
          <div style="display: flex; gap: var(--space-md);">
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Start Time</label>
              <input type="time" id="show-time" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
            <div style="flex: 1;">
              <label style="display:block; margin-bottom: 4px; font-size: 12px; color: var(--clr-text-dim);">Ticket Price (₹)</label>
              <input type="number" id="show-price" value="250" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px;">
            </div>
          </div>
        </div>
        <button id="save-showtime-btn" class="btn-primary" style="width: 100%;">Schedule Showtime</button>
      </div>
    </div>
  `;

  // Bind Back Button
  document.getElementById('client-back-btn').addEventListener('click', onBack);

  // Bind Tabs
  const tabScreen = document.getElementById('tab-screen');
  const tabShowtime = document.getElementById('tab-showtime');
  const sectionScreen = document.getElementById('section-screen-builder');
  const sectionShowtime = document.getElementById('section-showtime-scheduler');

  tabScreen.addEventListener('click', () => {
    sectionScreen.style.display = 'block';
    sectionShowtime.style.display = 'none';
    tabScreen.style.color = 'var(--clr-primary)';
    tabScreen.style.borderBottom = '2px solid var(--clr-primary)';
    tabShowtime.style.color = 'var(--clr-text-dim)';
    tabShowtime.style.borderBottom = 'none';
  });

  tabShowtime.addEventListener('click', () => {
    sectionScreen.style.display = 'none';
    sectionShowtime.style.display = 'block';
    tabShowtime.style.color = 'var(--clr-primary)';
    tabShowtime.style.borderBottom = '2px solid var(--clr-primary)';
    tabScreen.style.color = 'var(--clr-text-dim)';
    tabScreen.style.borderBottom = 'none';
  });

  // Load Data
  let movies = [];
  let theaters = [];
  try {
    [movies, theaters] = await Promise.all([getMovies(), getTheaters()]);
    
    // Populate Selects
    const tSelects = [document.getElementById('screen-theater-select'), document.getElementById('show-theater-select')];
    tSelects.forEach(sel => {
      sel.innerHTML = '<option value="">-- Select Theater --</option>' + 
        theaters.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    });

    const mSelect = document.getElementById('show-movie-select');
    mSelect.innerHTML = '<option value="">-- Select Movie --</option>' + 
      movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');

  } catch (e) {
    console.error("Error loading data for Client Portal", e);
  }

  // Live Preview Logic
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

  // Save Screen
  document.getElementById('save-screen-btn').addEventListener('click', async (e) => {
    const theaterId = document.getElementById('screen-theater-select').value;
    const name = document.getElementById('screen-name').value;
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);

    if(!theaterId || !name || !rows || !cols) return alert("Please fill all fields.");

    e.target.disabled = true;
    e.target.textContent = 'Saving...';
    
    const loader = document.createElement('div');
    loader.className = 'nothing-loader';
    document.body.appendChild(loader);

    try {
      await createScreen(theaterId, { name, rows, cols });
      alert("Screen created successfully!");
      document.getElementById('screen-name').value = '';
    } catch(err) {
      alert("Failed to create screen.");
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Save Screen';
      loader.remove();
    }
  });

  // Save Showtime
  document.getElementById('save-showtime-btn').addEventListener('click', async (e) => {
    const movieId = document.getElementById('show-movie-select').value;
    const theaterId = document.getElementById('show-theater-select').value;
    const time = document.getElementById('show-time').value;
    const price = parseInt(document.getElementById('show-price').value);

    if(!movieId || !theaterId || !time || !price) return alert("Please fill all fields.");

    e.target.disabled = true;
    e.target.textContent = 'Scheduling...';

    const loader = document.createElement('div');
    loader.className = 'nothing-loader';
    document.body.appendChild(loader);

    try {
      await createShowtime({ movieId, theaterId, time, price, ownerId: user.uid });
      alert("Showtime scheduled successfully!");
    } catch(err) {
      alert("Failed to schedule showtime.");
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Schedule Showtime';
      loader.remove();
    }
  });
}
