import { getAllUsers, grantClientAccess } from './db.js';
import { renderLoading } from './ui.js';

export async function renderAdminPortal(container, onBack) {
  renderLoading('Loading Admin Portal...');

  try {
    const users = await getAllUsers();
    
    // Calculate simple stats
    const totalUsers = users.length;
    const pendingApprovals = users.filter(u => u.role !== 'admin' && u.role !== 'client').length; // Simplistic metric
    
    container.innerHTML = `
      <div class="portal admin-portal glass-panel" style="padding: var(--space-xl); max-width: 1000px; margin: 0 auto; border-radius: 12px; margin-top: var(--space-xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
          <h2 style="font-family: 'Share Tech Mono', monospace; font-size: 24px; color: var(--clr-primary);">ADMIN OVERVIEW</h2>
          <button id="admin-back-btn" class="btn-ghost">Back to Dashboard</button>
        </div>

        <div class="bento-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-2xl);">
          <div class="bento-card glass-panel" style="padding: var(--space-lg); text-align: center;">
            <div style="font-size: 14px; color: var(--clr-text-dim);">TOTAL USERS</div>
            <div style="font-family: 'Share Tech Mono', monospace; font-size: 36px; color: var(--clr-primary); margin-top: 8px;">${totalUsers}</div>
          </div>
          <div class="bento-card glass-panel" style="padding: var(--space-lg); text-align: center;">
            <div style="font-size: 14px; color: var(--clr-text-dim);">PENDING ROLES</div>
            <div style="font-family: 'Share Tech Mono', monospace; font-size: 36px; color: #FF3131; margin-top: 8px;">${pendingApprovals}</div>
          </div>
        </div>

        <h3 style="font-family: 'Share Tech Mono', monospace; font-size: 18px; margin-bottom: var(--space-md);">USER MANAGEMENT</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <th style="padding: 12px; color: var(--clr-text-dim);">User</th>
                <th style="padding: 12px; color: var(--clr-text-dim);">Email</th>
                <th style="padding: 12px; color: var(--clr-text-dim);">Role</th>
                <th style="padding: 12px; color: var(--clr-text-dim);">Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 12px;">${u.displayName || 'Unknown'}</td>
                  <td style="padding: 12px; font-family: monospace;">${u.email}</td>
                  <td style="padding: 12px;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); font-size: 12px; text-transform: uppercase;">
                      ${u.role || 'user'}
                    </span>
                  </td>
                  <td style="padding: 12px;">
                    ${u.role !== 'admin' && u.role !== 'client' ? `
                      <button class="btn-outline grant-client-btn" data-uid="${u.uid}" style="padding: 4px 12px; font-size: 12px; border-color: #FF3131; color: #FF3131;">
                        Grant Client
                      </button>
                    ` : '<span style="color:var(--clr-text-dim); font-size: 12px;">N/A</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    document.getElementById('admin-back-btn').addEventListener('click', onBack);

    const grantBtns = container.querySelectorAll('.grant-client-btn');
    grantBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.target.dataset.uid;
        e.target.disabled = true;
        e.target.textContent = 'Updating...';
        // Show Nothing-Red loader globally or locally
        const loader = document.createElement('div');
        loader.className = 'nothing-loader';
        document.body.appendChild(loader);

        try {
          await grantClientAccess(uid);
          // Refresh portal
          renderAdminPortal(container, onBack);
        } catch (error) {
          alert('Failed to grant client access');
          e.target.disabled = false;
          e.target.textContent = 'Grant Client';
        } finally {
          loader.remove();
        }
      });
    });

  } catch (err) {
    console.error('[AdminPortal] Error loading data:', err);
    container.innerHTML = `<div class="view"><p>Error loading Admin Portal.</p></div>`;
  }
}
