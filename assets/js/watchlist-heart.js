/* watchlist-heart.js — Drop-in watchlist heart icon for value pages.
   Include on any page that renders item cards with class "item-wrapper".
   Auto-extracts item info from the card's DOM content — no data attributes needed. */

(function () {
  const WL_KEY = 'gv_watchlist';

  function getWL() {
    try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch { return []; }
  }
  function saveWL(wl) { localStorage.setItem(WL_KEY, JSON.stringify(wl)); }

  function isInWL(id) {
    return getWL().some(w => w.id === id);
  }

  function toggleWL(info) {
    let wl = getWL();
    const idx = wl.findIndex(w => w.id === info.id);
    let added = false;
    if (idx >= 0) {
      wl.splice(idx, 1);
    } else {
      wl.push({
        id: info.id, name: info.name, sourceType: info.type,
        category: info.category || '', image: info.image || '',
        currentValue: info.value || 0, savedValue: info.value || 0,
        diff: 0, trend: info.trend || 'Unknown', demand: info.demand || 0,
        addedAt: new Date().toISOString()
      });
      added = true;
    }
    saveWL(wl);
    return added;
  }

  // Detect page type from URL or page title
  function detectType() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('chroma')) return 'Chroma';
    if (path.includes('ancient')) return 'Ancient';
    if (path.includes('vintage')) return 'Vintage';
    if (path.includes('evo')) return 'Evo';
    if (path.includes('unique')) return 'Unique';
    if (path.includes('set')) return 'Set';
    if (path.includes('common')) return 'Common';
    if (path.includes('legendar')) return 'Legendary';
    if (path.includes('rare')) return 'Rare';
    if (path.includes('uncommon')) return 'Uncommon';
    if (path.includes('blox-fruits') || path.includes('bloxfruit')) return 'BloxFruits';
    return 'Godly';
  }

  // Extract item info from the card DOM
  function extractInfo(card) {
    // If card has data attributes (preferred), use those
    if (card.dataset.itemId) {
      return {
        id: card.dataset.itemId,
        name: card.dataset.itemName || 'Unknown',
        type: card.dataset.itemType || detectType(),
        image: card.dataset.itemImg || '',
        value: parseInt(card.dataset.itemValue) || 0,
        demand: parseInt(card.dataset.itemDemand) || 0,
        trend: card.dataset.itemTrend || 'Stable',
        category: card.dataset.itemCategory || ''
      };
    }

    // Auto-extract from DOM content
    const nameEl = card.querySelector('.item-name, .fruit-name, .text-base.font-bold, h3, h2');
    const name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return null;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const imgEl = card.querySelector('img');
    const image = imgEl ? imgEl.src : '';

    // Extract value from the formatted display
    let value = 0;
    const valEl = card.querySelector('.font-extrabold, .text-white.font-bold');
    if (valEl) {
      const txt = valEl.textContent.trim();
      if (txt.includes('M')) value = parseFloat(txt) * 1000000;
      else if (txt.includes('K')) value = parseFloat(txt) * 1000;
      else value = parseInt(txt.replace(/[^0-9]/g, '')) || 0;
    }

    // Try to find category from badge text
    const badgeEl = card.querySelector('.badge-wrapper span, [class*="badge"] span');
    const category = badgeEl ? badgeEl.textContent.trim().toLowerCase() : '';

    return { id, name, type: detectType(), image, value, demand: 0, trend: 'Stable', category };
  }

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .wl-heart-btn{position:absolute;top:8px;right:8px;z-index:30;width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;opacity:0;transform:scale(.8);background:rgba(0,0,0,.5);backdrop-filter:blur(6px)}
    .item-wrapper:hover .wl-heart-btn,.fruit-card:hover .wl-heart-btn,.wl-heart-btn.favorited{opacity:1;transform:scale(1)}
    .wl-heart-btn svg{width:18px;height:18px;transition:all .25s}
    .wl-heart-btn:not(.favorited) svg{fill:none;stroke:#9ca3af;stroke-width:2}
    .wl-heart-btn:not(.favorited):hover svg{stroke:#ec4899}
    .wl-heart-btn.favorited svg{fill:#ec4899;stroke:#ec4899;stroke-width:2;filter:drop-shadow(0 0 6px rgba(236,72,153,.5))}
    .wl-heart-btn.favorited{background:rgba(236,72,153,.15);border:1px solid rgba(236,72,153,.3)}
    .wl-heart-btn:active{transform:scale(.85)!important}
    @keyframes wl-pop{0%{transform:scale(.85)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
    .wl-heart-btn.pop{animation:wl-pop .3s ease}
    .wl-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:#111214;border:1px solid rgba(236,72,153,.3);color:#e5e7eb;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5);z-index:9999;opacity:0;transition:.3s;display:flex;align-items:center;gap:8px;pointer-events:none}
    .wl-toast.show{transform:translateX(-50%) translateY(0);opacity:1}
    .wl-toast svg{width:16px;height:16px;flex-shrink:0}
  `;
  document.head.appendChild(style);

  // Toast element
  const toast = document.createElement('div');
  toast.className = 'wl-toast';
  toast.id = 'wlToast';
  document.body.appendChild(toast);

  function showToast(msg, isFav) {
    const t = document.getElementById('wlToast');
    const color = isFav ? '#ec4899' : '#6b7280';
    t.innerHTML = `<svg viewBox="0 0 24 24" fill="${isFav ? color : 'none'}" stroke="${color}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>${msg}</span>`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  function processCards() {
    document.querySelectorAll('.item-wrapper, .fruit-card').forEach(card => {
      if (card.dataset.wlProcessed) return;
      card.dataset.wlProcessed = 'true';

      const info = extractInfo(card);
      if (!info || !info.name) return;

      // Ensure position relative for absolute heart button
      const cs = getComputedStyle(card);
      if (cs.position === 'static') card.style.position = 'relative';

      const btn = document.createElement('button');
      const fav = isInWL(info.id);
      btn.className = 'wl-heart-btn' + (fav ? ' favorited' : '');
      btn.innerHTML = HEART_SVG;
      btn.title = fav ? 'Remove from Watchlist' : 'Add to Watchlist';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const added = toggleWL(info);
        btn.classList.toggle('favorited', added);
        btn.classList.add('pop');
        btn.title = added ? 'Remove from Watchlist' : 'Add to Watchlist';
        setTimeout(() => btn.classList.remove('pop'), 300);
        showToast(added ? `${info.name} added to Watchlist ♥` : `${info.name} removed from Watchlist`, added);
      });

      card.appendChild(btn);
    });
  }

  // MutationObserver for dynamically rendered cards
  const observer = new MutationObserver(() => processCards());

  function start() {
    processCards();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
