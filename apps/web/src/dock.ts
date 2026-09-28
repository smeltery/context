// @ts-nocheck
/* Context dock renderer. Faithful markup of the real sidebar; no behaviour of its own,
   so pages drive it (scroll reveals, parallax, highlighting) however they like.

   const el = ContextDock.render({ base: '..//icons/', theme: 'light', items: ContextDock.DEFAULT })
   host.appendChild(el)
   Every cell gets data-type and data-id so pages can target it.
   Items: app {icon, running, minutes (temporary item, shows the '60m' capsule)}, link, player, weather,
   bluetooth, clipboard, keyboard, stats {metrics: [['CPU','24%'],…] — CPU GPU RAM SSD TMP FAN}, usage, activity, divider.
   ContextDock.cell(item, base) returns one cell on its own (for big single-cell renders).
   Pass lazy: true to render() for docks below the fold, so their icons load as they come into view. */

  const SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#FFCC00"/><g stroke="#FFCC00" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v2.6M12 19.9v2.6M1.5 12h2.6M19.9 12h2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></g></svg>';
  const BT = '<svg viewBox="0 0 24 24"><path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const KBD = '<svg viewBox="0 0 34 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="1" width="32" height="22" rx="3.5"/><g fill="currentColor" stroke="none"><rect x="5" y="5.5" width="3" height="2.8" rx=".5"/><rect x="10" y="5.5" width="3" height="2.8" rx=".5"/><rect x="15" y="5.5" width="3" height="2.8" rx=".5"/><rect x="20" y="5.5" width="3" height="2.8" rx=".5"/><rect x="25" y="5.5" width="3" height="2.8" rx=".5"/><rect x="5" y="10.5" width="3" height="2.8" rx=".5"/><rect x="10" y="10.5" width="3" height="2.8" rx=".5"/><rect x="15" y="10.5" width="3" height="2.8" rx=".5"/><rect x="20" y="10.5" width="3" height="2.8" rx=".5"/><rect x="25" y="10.5" width="3" height="2.8" rx=".5"/><rect x="9" y="15.8" width="16" height="2.8" rx=".5"/></g></svg>';
  const PLAY = '<svg viewBox="0 0 10 10"><path d="M2.5 1.2v7.6L8.8 5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 10 10"><path d="M2 1.2h2.2v7.6H2zM5.8 1.2H8v7.6H5.8z"/></svg>';

  // Eleven items, so a page can add one (the zoom page's temporary Figma) and stay within the app's twelve.
  const DEFAULT = [
    { type: 'app', id: 'synara', icon: 'synara.avif', name: 'Synara', running: true, href: 'https://www.trysynara.com/' },
    { type: 'app', id: 'chatgpt', icon: 'chatgpt.avif', name: 'ChatGPT', running: true },
    { type: 'divider' },
    { type: 'link', id: 'github', icon: 'github.svg', name: 'github.com', invert: true },
    { type: 'player', id: 'player', name: 'Mini Player', playing: false },
    { type: 'divider' },
    { type: 'weather', id: 'weather', temp: 27, name: 'Weather' },
    { type: 'bluetooth', id: 'bluetooth', count: 1, name: 'Bluetooth' },
    { type: 'clipboard', id: 'clipboard', name: 'Clipboard' },
    { type: 'keyboard', id: 'keyboard', name: 'Keyboard Cleaner' },
    { type: 'stats', id: 'stats', name: 'Stats' },
    { type: 'divider' },
    { type: 'usage', id: 'usage-claude', icon: 'claude.svg', pct: 98, name: 'Claude Code', invert: true },
    { type: 'activity', id: 'activity', icon: 'openai.svg', open: 1, name: 'AI Activity', invert: true },
  ];

  const ring = (pct) => {
    const r = 15, c = 2 * Math.PI * r;
    const col = pct <= 10 ? 'var(--skd-red)' : pct <= 25 ? 'var(--skd-orange)' : 'var(--skd-green)';
    return `<svg class="dial" viewBox="0 0 34 34"><circle cx="17" cy="17" r="${r}" fill="none" stroke="var(--skd-hair)" stroke-opacity=".6" stroke-width="2.9"/><circle cx="17" cy="17" r="${r}" fill="none" stroke="${col}" stroke-width="2.9" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(2)}"/></svg>`;
  };

  function inner(it, base, lazy) {
    const img = (src, cls = 'skd-icon') => `<img class="${cls}" src="${base}${src}" alt="" draggable="false"${lazy ? ' loading="lazy"' : ''}${it.invert ? ' data-invert' : ''}>`;
    switch (it.type) {
      case 'app': return img(it.icon);
      case 'link': return `<span class="skd-link">${img(it.icon, '')}</span>`;
      case 'player': return `${img('spotify.avif', 'skd-art')}<span class="skd-play">${it.playing ? PAUSE : PLAY}</span>`;
      case 'weather': return `<span class="skd-weather">${SUN}<b>${it.temp}°</b></span>`;
      case 'bluetooth': return `<span class="skd-bt">${BT}<span class="skd-badge">${it.count}</span></span>`;
      case 'clipboard': return `<span class="skd-clip">${img('clipboard.svg', '')}</span>`;
      case 'keyboard': return `<span class="skd-kbd">${KBD}</span>`;
      case 'usage': return `<span class="skd-ring"><span class="skd-ring-dial">${ring(it.pct)}${img(it.icon, 'glyph')}</span><small>${it.pct}%</small></span>`;
      case 'activity': return `<span class="skd-activity"><span class="g">${img(it.icon, '')}<i></i></span><small>${it.open} open</small></span>`;
      case 'stats': return `<span class="skd-stats">${(it.metrics || [['CPU', '24%'], ['GPU', '12%'], ['RAM', '61%'], ['SSD', '48%']]).map(([k, v]) => `<span class="skd-metric"><span>${k}</span><b>${v}</b></span>`).join('')}</span>`;
    }
    return '';
  }

  function cell(it, base = '/icons/', lazy = false) {
    const el = document.createElement(it.href ? 'a' : 'div');
    if (it.type === 'divider') { el.className = 'skd-divider'; el.dataset.type = 'divider'; return el; }
    el.className = `skd-cell skd-${it.type}` + (it.running ? ' skd-run' : '') + (it.type === 'stats' ? ' skd-cell--stats' : '');
    el.dataset.type = it.type;
    if (it.id) el.dataset.id = it.id;
    if (it.href) {
      el.href = it.href;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.setAttribute('aria-label', `${it.name} website`);
    } else {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', it.name || it.type);
    }
    el.innerHTML = inner(it, base, lazy) + (it.minutes ? `<span class="skd-temp">${it.minutes}m</span>` : '');
    return el;
  }

  function render(opts = {}) {
    const { base = '/icons/', theme = 'light', items = DEFAULT, lazy = false } = opts;
    const dock = document.createElement('div');
    dock.className = 'skd';
    dock.dataset.theme = theme;
    items.forEach((it) => dock.appendChild(cell(it, base, lazy)));
    return dock;
  }

  /* Swap a player cell between play and pause. */
  function setPlaying(cellEl, playing) {
    const b = cellEl.querySelector('.skd-play');
    if (b) b.innerHTML = playing ? PAUSE : PLAY;
  }

export const ContextDock = { render, cell, setPlaying, DEFAULT };
