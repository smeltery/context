// @ts-nocheck
export function initShortcutsCustomize() {
  const BASE = '/icons/';
  const $ = (id) => document.getElementById(id);
  const mini = (items, size) => { const d = window.ContextDock.render({ base: BASE, items, lazy: true }); d.style.fontSize = size + 'px'; return d; };

  /* ---------- shortcuts ---------- */
  const kc = (k, cls = '') => `<span class="kc${k.length > 1 ? ' wide' : ''}${cls ? ' ' + cls : ''}">${k}</span>`;
  const kcs = (keys) => `<span class="kcs">${keys.map((k) => kc(k, 's')).join('')}</span>`;
  const scReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenSeen = (el, on, off) => new IntersectionObserver(([e]) => (e.isIntersecting ? on : off)(), { threshold: .35 }).observe(el);

  // Hero: each step presses its keys in the overlay, then the screen reacts.
  const scStage = $('scStage'), scDock = $('scDock'), scCard = $('scCard'), scWin = $('scWin'), scHud = $('scHud'), scApp = $('scApp');
  scDock.appendChild(mini([
    { type: 'app', id: 'sc-safari', icon: 'safari.png', running: true },
    { type: 'link', id: 'sc-gh', icon: 'github.svg', invert: true },
    { type: 'divider' },
    { type: 'weather', id: 'sc-weather', temp: 68 },
    { type: 'player', id: 'sc-player' },
    { type: 'bluetooth', id: 'sc-bt', count: 1 },
    { type: 'clipboard', id: 'sc-clip' },
  ], 1));
  const placeCard = () => {
    const c = scDock.querySelector('[data-id="sc-weather"]').getBoundingClientRect(), s = scStage.getBoundingClientRect();
    const top = c.top + c.height / 2 - s.top - scCard.offsetHeight / 2;
    scCard.style.top = Math.max(36, Math.min(s.height - scCard.offsetHeight - 12, top)) + 'px';
  };
  const SCENES = [
    { dock: true, card: true, win: false },
    { dock: false, card: false, win: false },
    { dock: false, card: false, win: true },
    { dock: false, card: false, win: false },
  ];
  const scene = (i) => {
    const sc = SCENES[i];
    placeCard();
    scDock.classList.toggle('in', sc.dock);
    scCard.classList.toggle('on', sc.card);
    scWin.classList.toggle('on', sc.win);
    scApp.textContent = sc.win ? 'Safari' : 'Finder';
  };
  const STEPS = [
    { keys: ['⌥', '⌘', 'W'], h: 'Open a widget', p: 'The dock slides out with the Weather card open. No pointer needed.' },
    { keys: ['esc'], h: 'Close it', p: 'Press Esc, click anywhere else or press the shortcut again.' },
    { keys: ['⌥', '⌘', 'S'], h: 'Bring an app forward', p: 'Safari opens or comes to the front, whatever app you are in.' },
    { keys: ['⌥', '⌘', 'S'], h: 'Press again to hide it', p: 'The same keys put it away, like switching apps from the Dock.' },
  ];
  const scSteps = $('scSteps');
  scSteps.innerHTML = STEPS.map((s, i) => `<li><button type="button" aria-pressed="false" data-i="${i}"><i class="fill"></i><span class="t">${s.h}${kcs(s.keys)}</span><span class="d"><span>${s.p}</span></span></button></li>`).join('');
  const stepBtns = [...scSteps.querySelectorAll('button')];
  let scTimers = [], scAt = -1;
  const later = (ms, fn) => scTimers.push(setTimeout(fn, ms));
  function play(i) {
    scTimers.forEach(clearTimeout); scTimers = [];
    scAt = i;
    stepBtns.forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-pressed', String(i === j)); });
    if (scReduced) { scene(i); return; }
    // Restart the progress fill on the new step.
    const fill = stepBtns[i].querySelector('.fill'); fill.style.animation = 'none'; void fill.offsetHeight; fill.style.animation = '';
    const keys = STEPS[i].keys;
    scHud.innerHTML = ''; scHud.classList.add('on');
    keys.forEach((k, j) => later(120 + j * 150, () => scHud.insertAdjacentHTML('beforeend', kc(k, 'in down'))));
    const landed = 120 + (keys.length - 1) * 150;
    later(landed + 170, () => scHud.querySelectorAll('.kc').forEach((c) => c.classList.remove('down')));
    later(landed + 260, () => scene(i));
    later(landed + 1500, () => scHud.classList.remove('on'));
  }
  stepBtns.forEach((b) => b.addEventListener('click', () => play(+b.dataset.i)));
  scSteps.style.setProperty('--dur', '3.6s');
  if (!scReduced) {
    scSteps.classList.add('auto', 'paused');
    scSteps.addEventListener('animationend', () => play((scAt + 1) % STEPS.length));
    let started = false;
    whenSeen(scStage, () => { scSteps.classList.remove('paused'); if (!started) { started = true; play(0); } }, () => scSteps.classList.add('paused'));
  } else {
    play(0);
  }
  addEventListener('resize', placeCard);

  // Recorder: a clash first, then keys that work.
  const scRec = $('scRec');
  const CHECK = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#34c759"/><path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const WARN = '<svg viewBox="0 0 16 16"><path d="M8 1.2l7 12.6H1z" fill="#ff8c80"/><path d="M8 6v3.6" stroke="#333" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.8" r=".95" fill="#333"/></svg>';
  scRec.innerHTML = `<i class="close"></i><div class="hd"><span class="ic"><img loading="lazy" src="${BASE}safari.png" alt=""></span><div><b>Safari</b><span>Choose keys that open it from any app.</span></div></div><div class="well"></div><div class="st"></div><div class="ft"><span>Cancel</span><span class="save off">Save</span></div>`;
  const well = scRec.querySelector('.well'), st = scRec.querySelector('.st'), save = scRec.querySelector('.save');
  const status = (kind, text) => { st.className = 'st ' + kind; st.innerHTML = (kind === 'ok' ? CHECK : kind === 'bad' ? WARN : '') + `<span>${text}</span>`; save.classList.toggle('off', kind !== 'ok'); };
  const idle = () => { well.innerHTML = '<em>Type a shortcut</em>'; status('idle', 'Use ⌘, ⌥ or ⌃ with any key, or an F-key on its own.'); };
  const hold = (mods) => { well.innerHTML = mods.map((m) => kc(m, 'down')).join('') + kc(' ', 'pending'); };
  const land = (keys) => {
    well.innerHTML = keys.map((k, j) => kc(k, j === keys.length - 1 ? 'in down' : 'down')).join('');
    setTimeout(() => well.querySelectorAll('.kc').forEach((c) => c.classList.remove('down')), 90);
  };
  const REC = [
    [900, () => hold(['⌘'])],
    [450, () => { land(['⌘', 'Space']); status('bad', 'macOS or another app already uses ⌘Space. Try another.'); }],
    [2400, () => hold(['⌥'])],
    [300, () => hold(['⌥', '⌘'])],
    [380, () => { land(['⌥', '⌘', 'S']); status('ok', 'Opens Safari from any app.'); }],
    [2800, idle],
  ];
  idle();
  if (scReduced) { well.innerHTML = ['⌥', '⌘', 'S'].map((k) => kc(k)).join(''); status('ok', 'Opens Safari from any app.'); }
  else {
    let recAt = 0, recTimer = 0;
    const tick = () => { const [wait, fn] = REC[recAt]; recTimer = setTimeout(() => { fn(); recAt = (recAt + 1) % REC.length; tick(); }, wait); };
    whenSeen(scRec, () => { if (!recTimer) tick(); }, () => { clearTimeout(recTimer); recTimer = 0; });
  }

  // Settings → Items
  const SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#FFCC00"/><g stroke="#FFCC00" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v2.6M12 19.9v2.6M1.5 12h2.6M19.9 12h2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></g></svg>';
  const BTI = '<svg viewBox="0 0 22 22"><rect width="22" height="22" rx="5.5" fill="#3d8cff"/><path d="M7 7.6l8 7-4 3.6V3.8l4 3.6-8 7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const WARNI = '<svg class="warn" viewBox="0 0 16 16"><path d="M8 1.2l7 12.6H1z" fill="#ff9f0a"/><path d="M8 6v3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.8" r=".95" fill="#fff"/></svg>';
  const ROWS = [
    [`<img loading="lazy" src="${BASE}safari.png" alt="">`, 'Safari', 'App', ['⌥', '⌘', 'S']],
    [`<img loading="lazy" src="${BASE}github.svg" alt="">`, 'github.com', 'Link', ['⌃', '⌥', 'G']],
    [SUN, 'Weather', 'Widget', ['⌥', '⌘', 'W']],
    [`<img loading="lazy" src="${BASE}spotify.png" alt="">`, 'Mini Player', 'Widget', ['⌘', 'F5'], true],
    [BTI, 'Bluetooth', 'Widget', null],
    [`<img loading="lazy" src="${BASE}clipboard.svg" alt="">`, 'Clipboard', 'Widget', ['⌃', '⌥', 'V']],
  ];
  $('scList').innerHTML = ROWS.map(([ic, n, kind, keys, warn]) => `<div><span class="ic">${ic}</span><span class="n">${n}<small>${kind}</small></span>${warn ? WARNI : ''}${keys ? kcs(keys) : '<span class="add">+</span>'}</div>`).join('');

  /* ---------- arrange ---------- */
  const ARR = [
    { h: 'Drag to add', p: 'Drop app bundles or http(s) links on the dock, several at once. Duplicates are skipped. Up to 12 apps, links and widgets.',
      vis: (v) => { v.innerHTML = `<img loading="lazy" class="ghost" src="${BASE}chatgpt.png" alt=""><span class="urlchip"><img loading="lazy" src="${BASE}github.svg" alt="">github.com</span>`; } },
    { h: 'Temporary items', p: 'Hold Option while you drop and the item leaves after 60 minutes. Pick another preset, a custom time, or Keep Permanently.',
      vis: (v) => { v.innerHTML = '<span class="key">⌥</span><span style="color:#9a9a9a">+ drop</span>'; v.appendChild(mini([{ type: 'app', id: 't', icon: 'figma.png', name: 'Figma', minutes: 60 }], 1.6)); } },
    { h: 'Dividers', p: 'Split the dock into groups with a slim line. Up to 11 dividers, and they never take an item slot.',
      vis: (v) => { v.appendChild(mini([{ type: 'app', id: 'a', icon: 'safari.png' }, { type: 'divider' }, { type: 'app', id: 'b', icon: 'notes.png' }], 1.1)); } },
    { h: 'Drag to reorder', p: 'Drag any item or divider along the dock and release to save the order. Release outside the dock to cancel.',
      vis: (v) => { const d = mini([{ type: 'app', id: 'a', icon: 'music.png' }, { type: 'app', id: 'b', icon: 'notion.png' }, { type: 'app', id: 'c', icon: 'ghostty.png' }], 1); d.children[1].style.cssText = 'transform:translate(34px,-6px) rotate(-6deg) scale(1.12);filter:drop-shadow(0 10px 14px rgba(0,0,0,.22));z-index:2'; v.appendChild(d); } },
  ];
  const arr = $('arr');
  ARR.forEach((a) => {
    const el = document.createElement('div');
    el.innerHTML = `<div class="vis" aria-hidden="true"></div><h3>${a.h}</h3><p>${a.p}</p>`;
    a.vis(el.querySelector('.vis'));
    arr.appendChild(el);
  });

  /* ---------- customize ---------- */
  const cap = (inner, label) => `<div class="cap">${inner}<span>${label}</span></div>`;
  // Apple's accent colours; the dock takes a softened mix of the picked one.
  const TINTS = [['None', ''], ['Accent', '#007aff'], ['Blue', '#007aff'], ['Purple', '#953d96'], ['Pink', '#f74f9e'], ['Red', '#e0383e'], ['Orange', '#f7821b'], ['Yellow', '#fcb827'], ['Green', '#62ba46'], ['Graphite', '#8c8c8c']];
  const CUST = [
    { h: 'Any edge', p: 'Left, right or bottom. Hover cards open inward, and dividers work on every edge.',
      vis: cap('<span class="scr l"><i></i></span>', 'Left') + cap('<span class="scr r"><i></i></span>', 'Right') + cap('<span class="scr b"><i></i></span>', 'Bottom') },
    { h: 'Dock or pill', p: 'Always visible like the macOS Dock, hidden until you reach the edge, or a small pill that opens under the pointer.',
      vis: cap('<span class="scr r"><i></i></span>', 'Dock') + cap('<span class="scr r" style="opacity:.55"><i style="opacity:.25"></i></span>', 'auto hide') + cap('<span class="scr pill"><i></i></span>', 'Pill') },
    { h: 'Attached or detached', p: 'Joined to the screen edge with flared corners like a notch, or floating a little off it.',
      vis: cap('<span class="scr att r"><i></i></span>', 'Attached') + cap('<span class="scr r"><i></i></span>', 'Detached') },
    { h: 'Solid, translucent or Liquid Glass', p: 'Flat paint, a frosted blur of the desktop, or glass that refracts what’s behind it on macOS 26.',
      vis: `<div class="matbg">${cap('<span class="mat solid"></span>', 'Solid')}${cap('<span class="mat trans"></span>', 'Translucent')}${cap('<span class="mat glass"></span>', 'Glass')}</div>` },
    { h: 'Tints', p: 'Your system accent or one of Apple’s colours, softened so the dock stays calm behind its icons. Light and dark follow macOS.',
      live: true, vis: `<div class="tintvis"><div class="tintdocks"></div><div class="tints" role="group" aria-label="Dock tint">${TINTS.map(([n, c], i) => `<button type="button" class="${n === 'None' ? 'none' : n === 'Accent' ? 'multi' : ''}" style="--c:${c}" aria-label="${n === 'Accent' ? 'System accent' : n}" aria-pressed="${i === 2}"></button>`).join('')}</div></div>` },
    { h: 'Icon size and magnification', p: 'Small, medium or large icons, with Dock-style magnification under the pointer.',
      vis: `<div class="sizes">${[32, 44, 56].map((s, i) => cap(`<img loading="lazy" src="${BASE}safari.png" alt="" width="${s * 1.3}" height="${s * 1.3}">`, ['Small', 'Medium', 'Large'][i])).join('')}</div>` },
  ];
  const cust = $('cust');
  CUST.forEach((c) => {
    const el = document.createElement('div');
    el.innerHTML = `<div class="vis"${c.live ? '' : ' aria-hidden="true"'}>${c.vis}</div><h3>${c.h}</h3><p>${c.p}</p>`;
    cust.appendChild(el);
  });

  /* tints: a light and a dark dock, retinted by the picker */
  const tintDocks = ['light', 'dark'].map((theme) => {
    const d = window.ContextDock.render({ base: BASE, theme, lazy: true, items: ['finder.png', 'safari.png', 'music.png'].map((icon, i) => ({ type: 'app', id: 'tint' + i, icon })) });
    d.setAttribute('aria-hidden', 'true');
    cust.querySelector('.tintdocks').appendChild(d);
    return d;
  });
  const swatches = [...cust.querySelectorAll('.tints button')];
  const tint = (i) => {
    const c = TINTS[i][1];
    swatches.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    tintDocks[0].style.backgroundColor = c ? `color-mix(in oklab, ${c} 20%, #ececee)` : '';
    tintDocks[1].style.backgroundColor = c ? `color-mix(in oklab, ${c} 34%, #1c1c1e)` : '';
  };
  let tintAt = 2, tintTimer = 0, tintAuto = true;
  tint(tintAt);
  const stopTints = () => { clearInterval(tintTimer); tintTimer = 0; };
  swatches.forEach((b, i) => b.addEventListener('click', () => { stopTints(); tintAt = i; tint(i); tintAuto = false; }));
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && tintAuto && !tintTimer) tintTimer = setInterval(() => { tintAt = 2 + (tintAt - 1) % (TINTS.length - 2); tint(tintAt); }, 1800);
      else if (!e.isIntersecting) stopTints();
    }, { threshold: .6 }).observe(cust.querySelector('.tintvis'));
  }
}
