/*  navbar-auth.js  –  Drop-in auth widget for the topbar
    Include AFTER supabase-js CDN on any page.
    Requires a <nav class="topbar"> element.                          */

(function () {
  const SUPA_URL = 'https://utrahbaolwcnyisxiaft.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmFoYmFvbHdjbnlpc3hpYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE5MTcsImV4cCI6MjA5MzgzNzkxN30.wYgWsMdNbi91zAEMivzRPo3raQuExiXTjlfTWYfB860';

  if (typeof supabase === 'undefined') return;
  const sb = supabase.createClient(SUPA_URL, SUPA_KEY);
  window.__gvSupabase = sb;

  const ACCOUNTS_KEY = 'gv_accounts';
  const CURRENT_ACCOUNT_KEY = 'gv_current_account';

  function getAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    } catch { return []; }
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function getCurrentAccount() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_ACCOUNT_KEY)) || null;
    } catch { return null; }
  }

  function saveCurrentAccount(account) {
    localStorage.setItem(CURRENT_ACCOUNT_KEY, JSON.stringify(account));
  }

  async function addAccount(user, profile) {
    const accounts = getAccounts();
    if (accounts.length >= 3) {
      alert('Maximum of 3 accounts allowed. Remove an account first.');
      return;
    }
    const existingIndex = accounts.findIndex(a => a.id === user.id);
    const accountData = {
      id: user.id,
      email: user.email,
      name: profile?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      provider: user.app_metadata?.provider || 'email',
      lastLogin: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...accountData, lastLogin: new Date().toISOString() };
    } else {
      accounts.push(accountData);
    }
    saveAccounts(accounts);
    saveCurrentAccount(accountData);
  }

  async function switchToAccount(accountId) {
    const accounts = getAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (!target) return;
    
    // Generate a login link for the account email
    try {
      const { data, error } = await sb.auth.admin.generateLink({
        type: 'magiclink',
        email: target.email
      });
      if (error) throw error;
      // Save as current and redirect to callback
      saveCurrentAccount(target);
      window.location.href = '/auth/callback.html?switch=true';
    } catch (err) {
      console.error('Failed to switch account:', err);
      alert('Could not switch to that account. Try logging in again.');
    }
  }

  function removeAccount(accountId) {
    if (!confirm('Remove this account from this device?')) return;
    const accounts = getAccounts().filter(a => a.id !== accountId);
    saveAccounts(accounts);
    const current = getCurrentAccount();
    if (current?.id === accountId) {
      if (accounts.length > 0) {
        saveCurrentAccount(accounts[0]);
      } else {
        localStorage.removeItem(CURRENT_ACCOUNT_KEY);
      }
    }
    window.location.reload();
  }

  window.__gvAddAccount = addAccount;
  window.__gvSwitchAccount = switchToAccount;
  window.__gvRemoveAccount = removeAccount;

  const style = document.createElement('style');
  style.textContent = `
    .gv-profile-wrap{position:relative;z-index:1100}
    .gv-profile-btn{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:40px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;transition:.25s}
    .gv-profile-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(212,175,55,.5)}
    .gv-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #d4af37}
    .gv-uname{font-size:13px;font-weight:600;color:#e5e7eb;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gv-chevron{transition:transform .3s;color:#9ca3af}
    .gv-dd{position:absolute;right:0;top:calc(100% + 8px);min-width:200px;max-height:400px;overflow-y:auto;background:#111214;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:6px;box-shadow:0 20px 50px rgba(0,0,0,.6);opacity:0;transform:translateY(-8px) scale(.96);pointer-events:none;transition:opacity .2s,transform .2s}
    .gv-dd.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
    .gv-dd a,.gv-dd button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;color:#d1d5db;font-size:13px;font-weight:500;font-family:'Inter',sans-serif;border-radius:10px;cursor:pointer;text-decoration:none;transition:.15s}
    .gv-dd a:hover,.gv-dd button:hover{background:rgba(255,255,255,.07);color:#fff}
    .gv-dd .gv-sep{height:1px;background:rgba(255,255,255,.08);margin:4px 10px}
    .gv-dd .gv-logout{color:#ef4444}
    .gv-dd .gv-logout:hover{background:rgba(239,68,68,.1);color:#f87171}
    .gv-dd .gv-section-title{font-size:11px;color:#6b7280;padding:8px 14px 4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .gv-dd .gv-account-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-radius:10px;transition:.15s}
    .gv-dd .gv-account-item:hover{background:rgba(255,255,255,.07)}
    .gv-dd .gv-account-item.active{background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3)}
    .gv-dd .gv-account-item img{width:28px;height:28px;border-radius:50%;border:2px solid #d4af37}
    .gv-dd .gv-account-item .gv-account-info{flex:1;min-width:0}
    .gv-dd .gv-account-item .gv-account-name{font-size:13px;color:#e5e7eb;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gv-dd .gv-account-item .gv-account-email{font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gv-dd .gv-add-account{color:#d4af37;border:1px dashed rgba(212,175,55,.4);background:rgba(212,175,55,.05);font-size:12px;padding:6px 10px;gap:6px}
    .gv-dd .gv-add-account:hover{background:rgba(212,175,55,.1);color:#f4d03f}
    .gv-dd .gv-add-account svg{width:12px;height:12px}
    .gv-login-btn{padding:8px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#d4af37,#f4d03f);color:#000;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:.25s}
    .gv-login-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(212,175,55,.35)}
  `;
  document.head.appendChild(style);

  async function init() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
      topbar.querySelectorAll('a').forEach(a => {
        if (a.href && a.href.includes('create-account')) a.style.display = 'none';
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'gv-profile-wrap';

    if (!session) {
      wrap.innerHTML = `<a href="/create-account.html" class="gv-login-btn">Sign In</a>`;
      topbar.appendChild(wrap);
      return;
    }

    const user = session.user;

    // Read from profiles table for accurate username/avatar
    let name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    let avatar = user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=64';

    try {
      const { data: profile } = await sb.from('profiles').select('username,avatar_url').eq('id', user.id).single();
      if (profile) {
        if (profile.username) name = profile.username;
        if (profile.avatar_url) avatar = profile.avatar_url;
      }
    } catch (e) {}

    wrap.innerHTML = `
      <div class="gv-profile-btn" id="gvProfileBtn">
        <img class="gv-avatar" src="${avatar}" alt="Avatar" onerror="this.src='https://www.gravatar.com/avatar/?d=mp&s=64'">
        <span class="gv-uname">${name}</span>
        <svg class="gv-chevron" id="gvChevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="gv-dd" id="gvDropdown">
        <a href="/topics">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Topics
        </a>
        <a href="/watchlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Watchlist
        </a>
        <a href="/profile/settings.html">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Settings
        </a>
        <div class="gv-sep"></div>
        <div class="gv-section-title">Accounts</div>
        <div id="gvAccountsList"></div>
        <button class="gv-add-account" onclick="window.location.href='/create-account.html?add=true'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Account
        </button>
        <div class="gv-sep"></div>
        <button class="gv-logout" id="gvLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log Out
        </button>
      </div>
    `;

    topbar.appendChild(wrap);

    // Render accounts list
    const accounts = getAccounts();
    const currentAcc = getCurrentAccount();
    const accountsList = document.getElementById('gvAccountsList');
    if (accountsList && accounts.length > 0) {
      accountsList.innerHTML = accounts.map(acc => `
        <div class="gv-account-item ${currentAcc?.id === acc.id ? 'active' : ''}" onclick="__gvSwitchAccount('${acc.id}')">
          <img src="${acc.avatar || 'https://www.gravatar.com/avatar/?d=mp&s=64'}" alt="" onerror="this.src='https://www.gravatar.com/avatar/?d=mp&s=64'">
          <div class="gv-account-info">
            <div class="gv-account-name">${acc.name}</div>
            <div class="gv-account-email">${acc.email}</div>
          </div>
          <button class="gv-remove-btn" onclick="event.stopPropagation();__gvRemoveAccount('${acc.id}')" style="background:none;border:none;color:#6b7280;cursor:pointer;padding:4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    }

    const btn = document.getElementById('gvProfileBtn');
    const dd = document.getElementById('gvDropdown');
    const chevron = btn.querySelector('.gv-chevron');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dd.classList.toggle('open');
      chevron.style.transform = open ? 'rotate(180deg)' : '';
    });

    document.addEventListener('click', () => {
      dd.classList.remove('open');
      chevron.style.transform = '';
    });

    document.getElementById('gvLogout').addEventListener('click', async () => {
      await sb.auth.signOut();
      localStorage.removeItem('gv_user');
      localStorage.removeItem('gv_username');
      window.location.href = '/create-account.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
