// @ts-nocheck
import "./styles.css";
import { ContextDock } from "./dock";

declare global {
  interface Window {
    ContextDock: typeof ContextDock;
    Lenis: new (opts?: Record<string, unknown>) => {
      destroy?: () => void;
      raf?: (t: number) => void;
    };
  }
}

window.ContextDock = ContextDock;

async function loadLenis() {
  if (window.Lenis) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/lenis.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("lenis failed"));
    document.head.appendChild(s);
  });
}

await loadLenis().catch(() => {
  /* smooth scroll optional */
});


  // Hide the hero until the intro can run in one go (see .pre/.intro); no-JS and reduced motion skip it.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('pre');



/* Intro: start once the headline's font is in, so it doesn't reflow mid-animation. */
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('pre')) return;
  const h1 = document.querySelector('.hero-copy h1');
  h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');
  let started = false;
  const start = () => {
    if (started) return; started = true;
    root.classList.remove('pre');
    // Reloaded partway down the page: nothing of the hero is on screen, so skip the show.
    if (scrollY > innerHeight * .5) return;
    root.classList.add('intro');
    setTimeout(() => root.classList.remove('intro'), 3000);
  };
  // Wait for Inter alone: fonts.ready also waits on unrelated work and resolves seconds late on slow phones.
  (document.fonts ? document.fonts.load('650 1em Inter') : Promise.resolve()).then(() => requestAnimationFrame(start), start);
  setTimeout(start, 1200);
})();

/* Menu on iPad and smaller: the nav drops down under the bar. */
(function () {
  const bar = document.querySelector('.topbar'), btn = document.getElementById('menuBtn'), nav = document.getElementById('primaryNav');
  const small = matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');
  const set = (open) => {
    bar.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };
  btn.addEventListener('click', () => set(!bar.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  // The scrim is the bar's ::after, so a click on it targets the bar itself.
  document.addEventListener('click', (e) => { if (e.target === bar || !bar.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bar.classList.contains('menu-open')) { set(false); btn.focus(); } });
  small.addEventListener('change', () => set(false));
})();

/* The mark in the top bar blinks and glances like the app's onboarding (ContextEyes). */
(function () {
  const mark = document.getElementById('mark');
  const eyes = [...mark.querySelectorAll('mask path')].map((el) => ({ el, c: el.dataset.c.split(' ').map(Number) }));
  const st = { open: 1, gaze: 0 };
  const draw = () => eyes.forEach(({ el, c: [x, y] }) => {
    el.setAttribute('transform', `translate(${x + st.gaze * 36} ${y}) scale(1 ${Math.max(.08, st.open)}) translate(${-x} ${-y})`);
  });
  const tween = (key, to, ms, ease) => new Promise((done) => {
    const from = st[key], t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      st[key] = from + (to - from) * ease(t); draw();
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
  const easeIn = (t) => t * t, easeOut = (t) => 1 - (1 - t) * (1 - t);
  const spring = (t) => 1 - Math.exp(-7 * t) * Math.cos(5 * t); // quick, slightly overshooting settle
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let blinking = false;
  async function blink(twice) {
    if (blinking) return; blinking = true;
    for (let i = 0; i < (twice ? 2 : 1); i++) {
      if (i) await sleep(140);
      await tween('open', 0, 70, easeIn);
      await sleep(20);
      await tween('open', 1, 140, easeOut);
    }
    blinking = false;
  }
  const look = (g) => tween('gaze', g, 450, spring);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  mark.parentElement.addEventListener('pointerenter', () => blink(true));
  (async () => {
    // Arrives, looks around at the page, blinks, then idles.
    await sleep(1150); look(-1);
    await sleep(650); await blink(true);
    await sleep(900); look(0);
    for (;;) {
      await sleep(2800 + Math.random() * 2200);
      if (document.hidden) continue;
      if (Math.random() < .5) look(Math.random() < .5 ? -1 : 0);
      await blink(Math.random() < .25);
    }
  })();
})();



(function () {
  const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.06 });
  const BASE = '/icons/';
  const STOPS = [
    { ids: ['safari', 'chatgpt'], mul: .8, h: 'Your apps, one click away.', p: 'Keep the apps you use most on the side of the screen. A dot means the app is running.' },
    { ids: ['figma'], mul: 1, h: 'Here for an hour, then gone.', p: 'Drag apps or web addresses onto the dock, up to twelve items. Hold Option as you drop and the item is temporary: it counts down and removes itself after 60 minutes, or a time you choose.' },
    { ids: ['github'], mul: 1, h: 'Links, with their own icons.', p: 'Drop any web address to keep it with its site icon. Click to open it, or copy the link from its menu.' },
    { ids: ['player'], mul: 1, h: 'Music, without switching apps.', p: 'The Mini Player follows Spotify or Music. Click it to play or pause, or open its card to seek through the track and change the volume.' },
    { ids: ['weather'], mul: 1, h: 'The weather, at a glance.', p: 'Your current location or any city you choose, in °C or °F, refreshed every 20 minutes from Apple Weather.' },
    { ids: ['bluetooth'], mul: 1, h: 'What is connected, and a way out.', p: 'The badge counts connected devices. Open the list to see them and disconnect one, after a quick confirmation.' },
    { ids: ['clipboard'], mul: 1, h: 'Copied it once? Copy it again.', p: 'Clipboard keeps the text, links, images and files you copy. Hover for the latest five, or click for the full history with search and previews.' },
    { ids: ['keyboard'], mul: 1, h: 'Wipe the keyboard. Nothing gets typed.', p: 'Keyboard Cleaner blocks keys and shortcuts while you clean; the mouse keeps working. Hold Esc for three seconds to unlock, or wait five minutes.' },
    { ids: ['stats'], mul: .62, h: 'Your Mac, by the numbers.', p: 'CPU, GPU, memory and disk right in the dock, or the hottest sensor and the fastest fan. Click for the full window.' },
    { ids: ['usage-claude'], mul: 1, h: 'How much AI you have left.', p: 'Rings for Claude Code, Codex, Cursor, Antigravity, GitHub Copilot, Devin, Grok, Ollama Cloud, OpenCode Go, OpenRouter and Z.ai. Show what you have used or what is left.' },
    { ids: ['activity'], mul: 1, h: 'Your agents, still working.', p: 'AI Activity counts the Codex and Claude Code sessions that are running or waiting for you. Open it for each session’s name, project and state.' },
  ];


  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = document.getElementById('world');
  const display = document.getElementById('display');
  const section = document.getElementById('zoom');
  const stage = document.getElementById('stage');
  const viewportFrame = document.getElementById('viewportFrame');
  const captionShade = document.getElementById('captionShade');
  const hero = document.getElementById('hero');
  const hint = document.getElementById('hint');
  const outro = document.getElementById('outro');
  const bar = document.querySelector('.topbar');
  const chrome = [document.querySelector('.menubar'), document.querySelector('.notch')];
  // Hero layers, front to back: the headline travels furthest.
  const heroLayers = [...hero.children].map((el, i) => [el, [70, 40, 20, 20][i] || 0]);

  // The Mac's own Dock, for scale.
  const md = document.getElementById('macdock');
  ['finder', 'safari', 'mail', 'messages', 'notes', 'calendar', 'photos', 'music', '|', 'spotify', 'figma', 'ghostty', 'xcode'].forEach((n) => {
    if (n === '|') { md.appendChild(document.createElement('i')); return; }
    const im = document.createElement('img'); im.src = BASE + n + '.png'; im.alt = ''; md.appendChild(im);
  });

  const ITEMS = ContextDock.DEFAULT.slice();
  ITEMS.splice(ITEMS.findIndex((i) => i.id === 'chatgpt') + 1, 0, { type: 'app', id: 'figma', icon: 'figma.png', name: 'Figma, temporary', minutes: 60 });
  const byId = (id) => ITEMS.find((x) => x.id === id);
  const dock = ContextDock.render({ base: BASE, items: ITEMS });
  display.appendChild(dock);
  dock.querySelectorAll('.skd-cell:not(a)').forEach((cell) => cell.setAttribute('aria-hidden', 'true'));
  dock.querySelectorAll('.skd-divider').forEach((d, i) => { d.dataset.id = 'div' + i; });
  const cells = [...dock.children];

  // Stop captions
  const stopsEl = document.getElementById('stops');
  const panels = STOPS.map((s) => {
    const d = document.createElement('div');
    d.className = 'stop';
    d.innerHTML = `<h2>${s.h}</h2><p>${s.p}</p>`;
    stopsEl.appendChild(d);
    return d;
  });

  // Static version for reduced motion
  const st = document.getElementById('static');
  STOPS.forEach((s) => {
    const a = document.createElement('article');
    const items = s.show || s.ids.map(byId);
    const mini = ContextDock.render({ base: BASE, items });
    a.appendChild(mini);
    const t = document.createElement('div');
    t.innerHTML = `<h3>${s.h}</h3><p>${s.p}</p>`;
    a.appendChild(t);
    st.appendChild(a);
  });

  if (reduced) root.classList.add('reduced');

  // ---- geometry, in points of the world (1720 x 1046) ----
  const SW = 1720, SH = 1046;
  let pos = {}, D;
  function measure() {
    world.style.transform = 'none';
    const wr = world.getBoundingClientRect();
    const dr = display.getBoundingClientRect();
    D = { l: dr.left - wr.left, t: dr.top - wr.top, r: dr.right - wr.left, b: dr.bottom - wr.top };
    cells.forEach((c) => {
      const r = c.getBoundingClientRect();
      pos[c.dataset.id] = { x: r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top };
    });
  }

  let W, H, stageHeight, sectionTop, timeline, total, stopCenters, compactLandscape;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function layout() {
    W = stage.clientWidth; H = viewportFrame.clientHeight; stageHeight = stage.clientHeight;
    sectionTop = section.offsetTop;
    stage.style.setProperty('--frame-height', H + 'px');
    stage.style.setProperty('--caption-height', Math.max(...panels.map((p) => p.offsetHeight)) + 'px');
    compactLandscape = W > 560 && W <= 860 && H < 520;
    const mobile = W <= 860 && !compactLandscape;
    let box;
    if (compactLandscape) {
      box = { x: W * .52, y: bar.offsetHeight + 18, w: W * .48 - 20, h: H - bar.offsetHeight - 34 };
    } else if (mobile) {
      const top = Math.min(H * .72, hero.offsetTop + hero.offsetHeight + 28);
      box = { x: 16, y: top, w: W - 32, h: H - top - 20 };
    } else {
      box = { x: W * .47, y: 96, w: W * .53 - Math.max(24, W * .035), h: H - 96 - 64 };
    }
    const z0 = Math.min(box.w / SW, box.h / SH);
    const S0 = { z: z0, fx: SW / 2, fy: SH / 2, ax: box.x + box.w / 2, ay: box.y + box.h / 2 };

    // Zoomed in, the Mac's screen fills the whole window: its right edge sits on the window's
    // right edge (where Context really lives) and the bezel never comes into view.
    const z1 = mobile ? Math.min(W * .36 / 66, H * .2 / 54) : Math.min(H * .24 / 54, W * .2 / 66);
    const ay = mobile ? H * .34 : H / 2;
    const stops = STOPS.map((s) => {
      const ps = s.ids.map((id) => pos[id]);
      const z = Math.max(z1 * s.mul, W / (D.r - D.l), stageHeight / (D.b - D.t));
      const fx = ps[0].x, fy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
      const ox = W - D.r * z;
      const oy = Math.min(-D.t * z, Math.max(stageHeight - D.b * z, ay - fy * z));
      return { z, fx, fy, ax: ox + fx * z, ay: oy + fy * z, closeup: true };
    });
    const zE = Math.min(W * (mobile ? .9 : .78) / SW, H * .56 / SH);
    const SE = { z: zE, fx: SW / 2, fy: SH / 2, ax: W / 2, ay: H * (mobile ? .6 : .6) };

    // Timeline in viewport heights
    timeline = []; stopCenters = [];
    let u = 0;
    const hold = (S, d) => { timeline.push({ a: u, b: u + d, A: S, B: S }); u += d; };
    const move = (A, B, d) => { timeline.push({ a: u, b: u + d, A, B }); u += d; };
    hold(S0, .35);
    move(S0, stops[0], 1.2);
    stops.forEach((S, i) => {
      stopCenters.push(u + .3);
      hold(S, .55);
      if (i < stops.length - 1) move(S, stops[i + 1], .45);
    });
    move(stops[stops.length - 1], SE, 1.2);
    hold(SE, .7);
    total = u;
    section.style.height = reduced ? '' : total * H + stageHeight + 'px';
    lenis.resize();
  }

  function camera(u) {
    const seg = timeline.find((s) => u <= s.b) || timeline[timeline.length - 1];
    const { A, B } = seg;
    if (A === B) return { z: A.z, ox: A.ax - A.fx * A.z, oy: A.ay - A.fy * A.z, fy: A.fy };
    const t = ease(clamp((u - seg.a) / (seg.b - seg.a)));
    // Keep a pivot point on a straight screen path while zoom changes geometrically.
    const P = B.z >= A.z ? B : A;
    const cx = P.fx, cy = P.fy;
    const sAx = A.ax + (cx - A.fx) * A.z, sAy = A.ay + (cy - A.fy) * A.z;
    const sBx = B.ax + (cx - B.fx) * B.z, sBy = B.ay + (cy - B.fy) * B.z;
    const z = Math.exp(lerp(Math.log(A.z), Math.log(B.z), t));
    let ox = lerp(sAx, sBx, t) - cx * z;
    let oy = lerp(sAy, sBy, t) - cy * z;
    if (A.closeup && B.closeup) {
      // Geometric zoom and linear translation otherwise expose a thin strip of
      // bezel between stops with different scales, even when both endpoints fit.
      ox = W - D.r * z;
      oy = clamp(oy, stageHeight - D.b * z, -D.t * z);
    }
    return { z, ox, oy, fy: lerp(A.fy, B.fy, t) };
  }

  let playing = false;
  const player = cells.find((c) => c.dataset.id === 'player');
  const zRange = () => [timeline[0].A.z * 2.2, timeline[2].A.z];

  function render() {
    ticking = false;
    const u = reduced ? 0 : clamp((scrollY - sectionTop) / H, 0, total);
    const mobile = W <= 860 && !compactLandscape;
    const cam = camera(u);
    world.style.transform = `translate3d(${cam.ox}px, ${cam.oy}px, 0) scale(${cam.z})`;

    // Hero copy drifts up and away faster than the screen (parallax).
    const hp = clamp(u / .9);
    const hf = clamp((u - .1) / .55);
    hero.style.opacity = 1 - hf;
    hero.style.transform = (mobile ? '' : 'translateY(-50%) ') + `translateY(${-hp * 180}px)`;
    hero.style.filter = hf > 0 ? `blur(${hf * 8}px)` : '';
    hero.style.visibility = hp >= 1 ? 'hidden' : '';
    heroLayers.forEach(([el, k]) => { el.style.transform = hp > 0 ? `translateY(${-ease(hp) * k}px)` : ''; });
    hint.style.opacity = 1 - clamp(u / .25);

    // Stop captions: fade and drift against the dock's movement.
    let captionOpacity = 0;
    panels.forEach((p, i) => {
      const d = u - stopCenters[i];
      const o = 1 - clamp((Math.abs(d) - .22) / .26);
      captionOpacity = Math.max(captionOpacity, o);
      p.style.opacity = o;
      p.style.visibility = o <= 0 ? 'hidden' : '';
      if (o <= 0) return;
      // Layered parallax: the headline leads, the body lags, and both pull into focus.
      const dd = mobile ? clamp(d, -.5, .5) : d;
      p.style.transform = mobile ? `translateY(${-dd * 40}px)` : `translateY(-50%) translateY(${-d * 120}px)`;
      p.style.filter = o < 1 ? `blur(${(1 - o) * 10}px)` : '';
      p.firstChild.style.transform = compactLandscape ? '' : `translateY(${-dd * (mobile ? 30 : 70)}px)`;
      p.lastChild.style.transform = compactLandscape ? '' : `translateY(${dd * (mobile ? 10 : 30)}px)`;
    });
    captionShade.style.opacity = captionOpacity;

    // Focus: fade cells away from the one being described once we are close.
    const [za, zb] = zRange();
    const w = clamp((cam.z - za) / (zb - za));
    const fy = cam.fy;
    // The menu bar and notch only belong to the full-screen view; they would sit huge behind the captions.
    chrome.forEach((el) => { el.style.opacity = 1 - clamp((cam.z - za * .9) / (za * .8)); });
    md.style.opacity = 1 - w * .5;
    md.style.filter = w > .01 ? `blur(${w * 3}px)` : '';
    // Depth of field: neighbours dim, recede and blur more the further they sit from the focus.
    // Blur is in world points, so the camera's zoom scales it with everything else.
    cells.forEach((c) => {
      const d = Math.abs(pos[c.dataset.id].y - fy);
      const near = w * clamp((d - 30) / 30), far = w * clamp((d - 30) / 80);
      c.style.opacity = 1 - near * .6 - far * .15;
      c.style.transform = near > 0 ? `scale(${1 - near * .08})` : '';
      c.style.filter = far > .01 ? `blur(${far * 1.8}px)` : '';
    });

    const nearPlayer = Math.abs(u - stopCenters[STOPS.findIndex((s) => s.ids[0] === 'player')]) < .45;
    if (nearPlayer !== playing) { playing = nearPlayer; ContextDock.setPlaying(player, playing); }

    bar.classList.toggle('solid', scrollY > 8);

    const oe = clamp((u - (total - .75)) / .35);
    outro.style.opacity = oe;
    outro.style.transform = `translateY(${(1 - oe) * 40}px)`;
    outro.style.filter = oe > 0 && oe < 1 ? `blur(${(1 - oe) * 8}px)` : '';
  }

  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  function init() { measure(); layout(); render(); }
  addEventListener('scroll', request, { passive: true });
  let resizeFrame = 0;
  const resize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (W === stage.clientWidth && H === viewportFrame.clientHeight && stageHeight === stage.clientHeight) return;
      layout(); request();
    });
  };
  addEventListener('resize', resize);
  const viewportObserver = new ResizeObserver(resize);
  viewportObserver.observe(stage);
  viewportObserver.observe(viewportFrame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  init();
})();



(() => {
  const BASE = '/icons/';
  const $ = (id) => document.getElementById(id);
  const mini = (items, size) => { const d = ContextDock.render({ base: BASE, items, lazy: true }); d.style.fontSize = size + 'px'; return d; };

  /* ---------- Stats window ---------- */
  const IC = {
    Overview: '<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
    CPU: '<rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6h2M1.5 10h2M12.5 6h2M12.5 10h2"/>',
    GPU: '<rect x="1.5" y="4" width="13" height="8" rx="1.5"/><circle cx="6" cy="8" r="2"/><path d="M10 6.5h2.5M10 9.5h2.5"/>',
    Memory: '<rect x="1.5" y="4.5" width="13" height="6" rx="1"/><path d="M4 10.5v2M7 10.5v2M10 10.5v2M13 10.5v2M4.5 6.5v2M7.5 6.5v2M10.5 6.5v2"/>',
    Storage: '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 9.5h12"/><circle cx="11.5" cy="11.2" r=".6"/>',
    Network: '<path d="M5 2.5v11M5 13.5l-2.5-2.5M5 13.5L7.5 11M11 13.5v-11M11 2.5L8.5 5M11 2.5L13.5 5"/>',
    Battery: '<rect x="1.5" y="5" width="12" height="6" rx="1.5"/><path d="M15 7v2"/><rect x="3" y="6.5" width="7" height="3" rx=".5" fill="currentColor" stroke="none"/>',
    Sensors: '<path d="M8 2a1.5 1.5 0 011.5 1.5v6.2a3 3 0 11-3 0V3.5A1.5 1.5 0 018 2z"/><circle cx="8" cy="12" r="1" fill="currentColor"/>',
    Processes: '<path d="M2 4h12M2 8h12M2 12h12"/>',
  };
  const spark = (pts) => `<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><path d="M0 34 L${pts.map((v, i) => `${(i / (pts.length - 1)) * 100} ${34 - v * .32}`).join(' L')} L100 34Z" fill="#1d1d1f" opacity=".07"/><path d="M${pts.map((v, i) => `${(i / (pts.length - 1)) * 100} ${34 - v * .32}`).join(' L')}" fill="none" stroke="#1d1d1f" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
  const tile = (h, b, sm, sp) => `<div class="tile"><h4>${h}</h4><b class="tnum">${b}</b><small>${sm}</small>${sp ? spark(sp) : ''}</div>`;
  const rows = (list) => `<div class="rows">${list.map(([k, v, bar]) => `<div><div>${k}${bar != null ? `<div class="bar"><i style="width:${bar}%"></i></div>` : ''}</div><span class="mut tnum">${v}</span></div>`).join('')}</div>`;
  const PANES = {
    Overview: `<div class="tiles">
      ${tile('CPU', '24%', 'User 14% · System 10%', [20, 34, 28, 40, 22, 30, 26, 44, 24, 30, 22, 24])}
      ${tile('GPU', '12%', 'Busiest GPU', [8, 10, 22, 12, 9, 14, 30, 12, 10, 12, 11, 12])}
      ${tile('Memory', '19.5 GB', 'of 32 GB · pressure normal', [58, 59, 60, 60, 61, 62, 61, 61, 60, 61, 61, 61])}
      ${tile('Storage', '482 GB', 'free of 994 GB')}
      ${tile('Network', '2.4 MB/s', 'down · 180 KB/s up', [10, 40, 22, 60, 30, 18, 70, 42, 20, 36, 50, 30])}
      ${tile('Battery', '82%', '312 cycles · 91% capacity')}
      ${tile('Sensors', '58 °C', 'hottest: CPU die')}
      ${tile('Fan', '1,840 rpm', 'fastest fan')}
    </div>`,
    CPU: rows([['User', '14%', 14], ['System', '10%', 10], ['Idle', '76%', 76], ['Logical cores', '12'], ['Load averages', '2.14 · 1.86 · 1.72'], ['Thermal state', 'Nominal']]),
    GPU: rows([['Utilization', '12%', 12], ['Renderer', '9%', 9], ['Tiler', '4%', 4], ['Available fields', 'Depend on the driver']]),
    Memory: rows([['Pressure', 'Normal', 38], ['App memory', '11.2 GB', 35], ['Wired', '3.1 GB', 10], ['Compressed', '1.4 GB', 4], ['Cached files', '3.8 GB', 12], ['Swap used', '0 bytes']]),
    Storage: rows([['Macintosh HD', '512 GB of 994 GB used', 52], ['Read', '38 MB/s'], ['Write', '12 MB/s'], ['NVMe health (SMART)', '99% · 41 °C']]),
    Network: rows([['Wi‑Fi (en0)', '↓ 2.4 MB/s · ↑ 180 KB/s'], ['VPN (utun4)', '↓ 310 KB/s · ↑ 42 KB/s'], ['Local address', '192.168.1.24'], ['Since interface start', '↓ 18.2 GB · ↑ 2.6 GB'], ['Note', 'VPN and physical traffic are never summed']]),
    Battery: rows([['Charge', '82%', 82], ['Maximum capacity', '91%', 91], ['Cycle count', '312'], ['Time remaining', '6 h 40 min'], ['Power', '8.4 W']]),
    Sensors: rows([['CPU die', '58 °C', 58], ['GPU', '51 °C', 51], ['SSD', '41 °C', 41], ['Left fan', '1,840 rpm'], ['System power', '14.2 W'], ['Battery voltage', '12.6 V']]),
    Processes: `<div class="tablewrap"><table class="proc"><thead><tr><th>Process</th><th>CPU</th><th>Memory</th><th>Disk I/O</th></tr></thead><tbody>
      ${[['figma.png', 'Figma', '18.2%', '1.9 GB', '1.2 MB/s'], ['safari.png', 'Safari', '9.4%', '1.4 GB', '240 KB/s'], ['chatgpt.png', 'ChatGPT', '6.1%', '820 MB', '80 KB/s'], ['xcode.png', 'Xcode', '4.8%', '2.6 GB', '3.4 MB/s'], ['spotify.png', 'Spotify', '2.2%', '410 MB', '60 KB/s']]
        .map(([i, n, c, m, d]) => `<tr><td><img loading="lazy" src="${BASE}${i}" alt="">${n}</td><td class="tnum">${c}</td><td class="tnum">${m}</td><td class="tnum">${d}</td></tr>`).join('')}
    </tbody></table></div><p class="mut" style="margin:10px 0 0;font-size:12px">Top 30 by CPU, memory or disk. Stats never ends a process.</p>`,
  };
  const nav = $('statsNav'), main = $('statsMain');
  main.innerHTML = `<div class="toolbar"><h3 id="paneTitle">Overview</h3><div class="tools"><span class="chip">Dock indicators</span><span class="seg" aria-label="Refresh interval"><span>1s</span><span class="on">2s</span><span>5s</span></span><span class="chip">Pause</span></div></div>` +
    Object.entries(PANES).map(([k, v], i) => `<div class="pane" data-pane="${k}"${i ? ' hidden' : ''}>${v}</div>`).join('');
  Object.keys(PANES).forEach((k, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-selected', i === 0);
    b.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true">${IC[k]}</svg>${k}`;
    b.onclick = () => {
      nav.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b));
      main.querySelectorAll('.pane').forEach((p) => (p.hidden = p.dataset.pane !== k));
      $('paneTitle').textContent = k;
    };
    nav.appendChild(b);
  });

  const METRICS = [['CPU', 'CPU', '24%', true], ['GPU', 'GPU', '12%', true], ['RAM', 'RAM — memory used', '61%', true], ['SSD', 'SSD — storage used', '48%', true], ['TMP', 'Temperature — hottest sensor', '58°', false], ['FAN', 'Fan — fastest fan, RPM', '1840', false]];
  const checks = $('statsChecks'), cellA = $('statsCellA');
  const drawStats = () => { cellA.replaceChildren(mini([{ type: 'stats', id: 'stats', metrics: METRICS.filter((m) => m[3]).map((m) => [m[0], m[2]]) }], 1.5)); };
  METRICS.forEach((m, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" id="metric-${m[0]}"${m[3] ? ' checked' : ''}>${m[1]}</label>`;
    const box = li.querySelector('input');
    box.onchange = () => {
      m[3] = box.checked;
      if (!METRICS.some((x) => x[3])) { m[3] = true; box.checked = true; }
      drawStats();
    };
    checks.appendChild(li);
  });
  drawStats();

  /* ---------- widget cards ---------- */
  const PLAY = '<svg viewBox="0 0 20 20"><path d="M6 3.5v13l11-6.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 20 20"><path d="M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z"/></svg>';
  const CARDS = [
    { item: { type: 'player', id: 'player', name: 'Mini Player' }, h: 'Mini Player',
      span: 2, p: 'Spotify or Music, whichever is playing. Play, pause, seek and set the volume.',
      card: `<div class="hrow" style="justify-content:flex-start;gap:12px"><img loading="lazy" src="${BASE}spotify.png" alt="" width="40" height="40"><div><div class="ctitle">Spotify</div><div class="mut">Playback controls</div></div></div>
        <div class="track"><i style="width:34%"></i></div><div class="hrow mut tnum" style="font-size:11px"><span>1:12</span><span>3:31</span></div>
        <div class="ctls"><button class="ctl" aria-label="Previous track"><svg viewBox="0 0 20 20"><path d="M4 4h2v12H4zM16 4v12L7 10z"/></svg></button><button class="ctl" id="playBtn" aria-label="Play">${PLAY}</button><button class="ctl" aria-label="Next track"><svg viewBox="0 0 20 20"><path d="M14 4h2v12h-2zM4 4v12l9-6z"/></svg></button></div>
        <div class="vol"><svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/></svg><div class="track"><i style="width:62%"></i></div></div>` },
    { item: { type: 'weather', id: 'weather', temp: 68, name: 'Weather' }, h: 'Weather',
      span: 2, p: 'Where you are or any city, in °C or °F, from Apple Weather.',
      card: `<div class="hrow"><div><div class="ctitle">New York</div><div class="mut">Partly sunny · H 70° L 58°</div></div><div style="font-size:34px;font-weight:300;letter-spacing:-.02em">68°</div></div>
        <div class="hours">${[['12', 66], ['13', 68], ['14', 70], ['15', 70], ['16', 69], ['17', 67]].map(([h, t]) => `<span>${h}<b>${t}°</b></span>`).join('')}</div>
        <div class="mut" style="font-size:11px;margin-top:12px">Updated 4 min ago · Apple Weather</div>` },
    { item: { type: 'bluetooth', id: 'bluetooth', count: 1, name: 'Bluetooth' }, h: 'Bluetooth',
      span: 2, p: 'See what’s connected and disconnect it, after a quick check.',
      card: `<div class="ctitle" style="margin-bottom:4px">Bluetooth</div><div id="btArea"><div class="row2"><span>AirPods Pro</span><button class="pill" id="btDisc">Disconnect</button></div></div><div class="mut" style="font-size:11px;margin-top:6px">Connected paired devices</div>` },
    { item: { type: 'keyboard', id: 'keyboard', name: 'Keyboard Cleaner' }, h: 'Keyboard Cleaner',
      span: 2, p: 'Wipe the keys, nothing gets typed. Hold Esc for three seconds to unlock.',
      card: `<div class="lock"><div class="ctitle" style="font-size:15px">Keyboard locked</div><div class="n tnum">128</div><div class="mut">key presses blocked</div><div class="mut" style="margin-top:8px">Hold Esc for 3 seconds to unlock · 4:52</div><span class="blk">Unlock Keyboard</span></div>` },
    { item: { type: 'clipboard', id: 'clipboard', name: 'Clipboard' }, h: 'Clipboard',
      span: 4, wide: true, p: 'The last five things you copied. Click one to copy it again, or open the full history.',
      card: '<div class="cb" id="cbCard"></div>' },
    { item: { type: 'usage', id: 'usage-claude', icon: 'claude.svg', pct: 98, name: 'Claude Code', invert: true }, h: 'AI Usage',
      span: 3, p: 'Eleven AI tools, one ring each. Show what’s used or what’s left.',
      card: `<div class="hrow" style="margin-bottom:12px"><span class="ctitle">AI Usage</span><button class="sw" role="switch" aria-checked="true" id="leftSw"><i></i>Show remaining</button></div>
        <div class="prov" id="prov"></div>
        <div class="more">${['Antigravity', 'GitHub Copilot', 'Devin', 'Grok', 'Ollama Cloud', 'OpenCode Go', 'OpenRouter', 'Z.ai'].map((n) => `<span>${n}</span>`).join('')}</div>` },
    { item: { type: 'activity', id: 'activity', icon: 'openai.svg', open: 2, name: 'AI Activity', invert: true }, h: 'AI Activity',
      span: 3, p: 'Codex and Claude Code sessions that are running or waiting for you.',
      card: `<div class="ctitle" style="margin-bottom:4px">AI Activity</div>
        <div class="sess"><span class="dot"></span><div><div>Refactor dock layout</div><div class="mut"><img loading="lazy" src="${BASE}openai.svg" alt="">Codex · lateraldock · running</div></div></div>
        <div class="sess"><span class="dot wait"></span><div><div>Write download copy</div><div class="mut"><img loading="lazy" src="${BASE}claude.svg" alt="">Claude Code · context-website · waiting</div></div></div>` },
  ];
  const cards = $('cards');
  CARDS.forEach((c) => {
    const el = document.createElement('article');
    el.className = 'wc';
    el.dataset.span = c.span || 3;
    // Full width on tablets, so the two-column grid comes out even.
    if (c.wide) el.dataset.wide = '';
    el.innerHTML = `<div class="lead"><div class="lead-dock"></div><div class="surf" style="flex:1;min-width:0">${c.card}</div></div><div><h3>${c.h}</h3><p>${c.p}</p></div>`;
    el.querySelector('.lead-dock').appendChild(mini([c.item], 1.25));
    cards.appendChild(el);
  });
  // player toggle
  let playing = false;
  const playBtn = $('playBtn'), pcell = cards.querySelector('.skd-cell[data-type="player"]');
  const setP = () => { playBtn.innerHTML = playing ? PAUSE : PLAY; playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play'); ContextDock.setPlaying(pcell, playing); };
  playBtn.onclick = () => { playing = !playing; setP(); };
  // bluetooth confirm
  const btArea = $('btArea');
  const btIdle = btArea.innerHTML;
  btArea.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'btDisc') btArea.innerHTML = `<div class="row2" style="display:block"><div style="margin-bottom:8px">Disconnect “AirPods Pro”?</div><div class="hrow" style="justify-content:flex-end;gap:6px"><button class="pill" id="btCancel">Cancel</button><button class="pill" id="btOk" style="background:#1d1d1f;color:#fff">Disconnect</button></div></div>`;
    else if (t.id === 'btOk') btArea.innerHTML = `<div class="row2"><span class="mut">No devices connected</span><button class="pill" id="btReset">Undo demo</button></div>`;
    else btArea.innerHTML = btIdle;
  });
  // AI usage used/left
  const PROV = [['claude.svg', 'Claude Code', 98], ['openai.svg', 'Codex', 89], ['cursor.png', 'Cursor', 64]];
  const sw = $('leftSw'), prov = $('prov');
  const drawProv = () => {
    const left = sw.getAttribute('aria-checked') === 'true';
    prov.innerHTML = PROV.map(([i, n, l]) => { const v = left ? l : 100 - l; return `<div class="p"><img loading="lazy" src="${BASE}${i}" alt="">${n}<span class="mut tnum">${v}% ${left ? 'left' : 'used'}</span><div class="bar"><i style="width:${v}%;background:${l <= 25 ? '#ff9f0a' : '#34c759'}"></i></div></div>`; }).join('');
  };
  sw.onclick = () => { sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true'); drawProv(); };
  drawProv();


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
    const d = ContextDock.render({ base: BASE, theme, lazy: true, items: ['finder.png', 'safari.png', 'music.png'].map((icon, i) => ({ type: 'app', id: 'tint' + i, icon })) });
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
})();



/* Clipboard: the widget card and the History window share one sample history, as they do in the app
   (lateraldock/Sources/Widgets/Clipboard). A local sample: it never reads or writes the visitor's clipboard. */
(() => {
  const BASE = '/icons/';
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DOC = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 1.5h4.8l3.2 3.2v9.8h-8z"/><path d="M9.3 1.5v3.2h3.2M6.5 8h3.5M6.5 10.5h3.5"/></svg>';
  const PAGE = '<svg viewBox="0 0 48 60" aria-hidden="true"><path d="M5 1h28l14 14v40a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4z" fill="#fff" stroke="#d2d2d7"/><path d="M33 1v10a4 4 0 0 0 4 4h10" fill="#f0f0f0" stroke="#d2d2d7"/><rect x="8" y="12" width="18" height="3" rx="1.5" fill="#a1a1a6"/><g fill="#d8d8dc"><rect x="8" y="22" width="32" height="2.4" rx="1.2"/><rect x="8" y="28" width="32" height="2.4" rx="1.2"/><rect x="8" y="34" width="25" height="2.4" rx="1.2"/><rect x="8" y="42" width="32" height="2.4" rx="1.2"/><rect x="8" y="48" width="19" height="2.4" rx="1.2"/></g></svg>';
  const X = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6"/></svg>';
  const KIND = { text: 'Text', link: 'Link', image: 'Image', file: 'File' };

  // Newest first, minutes ago.
  const samples = () => [
    { kind: 'text', app: ['Notes', 'notes.png'], ago: 2, text: 'Standup notes\nShipped the new tint picker.\nClipboard previews are in review.\nNext: filter by type.' },
    { kind: 'link', app: ['Safari', 'safari.png'], ago: 6, url: 'https://github.com/sparkle-project/Sparkle', icon: 'github.svg',
      title: 'GitHub - sparkle-project/Sparkle: A software update framework for macOS', detail: 'A software update framework for macOS. Contribute to sparkle-project/Sparkle development by creating an account on GitHub.', site: 'GitHub' },
    { kind: 'image', app: ['Figma', 'figma.png'], ago: 14, src: '/assets/context-icon.png', w: 512, h: 512, alt: 'The Context app icon' },
    { kind: 'text', app: ['Mail', 'mail.png'], ago: 31, text: 'Thursday at 3 works for me. I’ll send the brief before then so we can go through it together.' },
    { kind: 'file', app: ['Finder', 'finder.png'], ago: 48, path: '/Users/you/Documents/Project brief.pdf', size: '248 KB' },
    { kind: 'text', app: ['Xcode', 'xcode.png'], ago: 75, text: 'func open() {\n    if window == nil { window = makeWindow() }\n    showWindow(nil)\n}' },
    { kind: 'text', app: ['Messages', 'messages.png'], ago: 130, text: 'Running ten minutes late, order me a flat white?' },
  ].map((e, i) => ({ ...e, id: 'c' + i, at: Date.now() - e.ago * 60e3 }));

  // The same one-line summary, card excerpt and search text as ClipboardEntry.
  const summary = (e) => e.kind === 'text' ? (e.text.split('\n').map((l) => l.trim()).find(Boolean) || 'Blank text')
    : e.kind === 'link' ? e.url : e.kind === 'image' ? `Image ${e.w}×${e.h}` : e.path.split('/').pop();
  const excerpt = (e) => e.kind === 'text' ? e.text.trim() : summary(e);
  const haystack = (e) => ({ text: e.text, link: e.url, file: e.path, image: summary(e) }[e.kind] + '\n' + e.app[0]).toLocaleLowerCase();
  const thumb = (e) => e.kind === 'text' ? `<span class="clip-thumb g">${DOC}</span>`
    : e.kind === 'link' ? `<span class="clip-thumb fav"><img src="${BASE}${e.icon}" alt=""></span>`
    : e.kind === 'image' ? `<span class="clip-thumb"><img src="${e.src}" alt=""></span>`
    : `<span class="clip-thumb doc">${PAGE}</span>`;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const ago = (t) => {
    const s = Math.round((t - Date.now()) / 1000);
    for (const [unit, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), unit);
    return rtf.format(s, 'second');
  };
  const stamp = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
  const day = (t) => {
    const d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  let entries = samples(), selectedId = null, copiedId = null, copiedTimer = 0;
  const search = $('clipSearch'), type = $('clipType'), list = $('clipList'), empty = $('clipEmpty'), detail = $('clipDetail');
  const copyBtn = $('clipCopy'), deleteBtn = $('clipDelete'), status = $('clipStatus'), card = $('cbCard');
  const filtered = () => {
    const q = search.value.trim().toLocaleLowerCase();
    return entries.filter((e) => (!type.value || e.kind === type.value) && (!q || haystack(e).includes(q)));
  };
  // Like the app, a selection hidden by the filter falls back to the first match without being forgotten.
  const selected = (shown = filtered()) => shown.find((e) => e.id === selectedId) || shown[0];
  const say = (text) => { status.textContent = ''; requestAnimationFrame(() => { status.textContent = text; }); };

  /* ---------- window ---------- */
  function renderList() {
    const shown = filtered();
    delete detail.dataset.id; // copied times change, so the detail is redrawn too
    const groups = [];
    shown.forEach((e) => { const t = day(e.at); if (groups.at(-1)?.t !== t) groups.push({ t, items: [] }); groups.at(-1).items.push(e); });
    list.innerHTML = groups.map((g, i) => `<div role="group" aria-labelledby="clip-day-${i}"><p class="clip-day" id="clip-day-${i}">${g.t}</p>${g.items.map((e) =>
      `<div class="clip-entry" role="option" id="clip-${e.id}" data-id="${e.id}" aria-selected="false">${thumb(e)}<span class="clip-name">${esc(summary(e))}</span>${e.id === copiedId ? '<span class="clip-ok">Copied</span>' : ''}</div>`).join('')}</div>`).join('');
    empty.hidden = shown.length > 0;
    empty.innerHTML = entries.length ? 'No matching entries.' : 'Nothing copied yet.<br><button type="button" class="pill" data-reset>Undo demo</button>';
    list.hidden = !shown.length;
    $('clipCount').textContent = entries.length;
    showSelection(shown);
  }

  function showSelection(shown = filtered(), reveal = false) {
    const sel = selected(shown);
    list.querySelectorAll('[role="option"]').forEach((o) => o.setAttribute('aria-selected', String(o.dataset.id === sel?.id)));
    [list, search].forEach((el) => sel ? el.setAttribute('aria-activedescendant', 'clip-' + sel.id) : el.removeAttribute('aria-activedescendant'));
    copyBtn.disabled = deleteBtn.disabled = !sel;
    if (detail.dataset.id !== (sel?.id ?? '')) renderDetail(sel);
    if (reveal && sel) {
      const o = $('clip-' + sel.id), lr = list.getBoundingClientRect(), r = o.getBoundingClientRect();
      // Bring the day heading along with the first row of a section.
      const top = o.previousElementSibling ? r.top : o.parentElement.getBoundingClientRect().top;
      if (top < lr.top) list.scrollTop -= lr.top - top;
      else if (r.bottom > lr.bottom - 10) list.scrollTop += r.bottom - lr.bottom + 10;
    }
  }

  function renderDetail(e) {
    detail.dataset.id = e?.id || '';
    if (!e) { detail.innerHTML = ''; return; }
    const preview = {
      text: () => `<p class="clip-text" data-lenis-prevent>${esc(e.text)}</p>`,
      link: () => `<div class="clip-link"><img src="${BASE}${e.icon}" alt=""><b>${esc(e.title)}</b><span>${esc(e.detail)}</span><small>${esc(e.site)}</small></div>`,
      image: () => `<div class="clip-image"><img src="${e.src}" alt="${esc(e.alt)}"></div>`,
      file: () => `<div class="clip-file" role="img" aria-label="PDF document">${PAGE}</div>`,
    }[e.kind]();
    const rows = [['Source', e.app[0], e.app[1]], ['Type', KIND[e.kind]]];
    if (e.kind === 'text') rows.push(['Characters', [...e.text].length.toLocaleString('en')], ['Words', e.text.split(/\s+/).filter(Boolean).length.toLocaleString('en')]);
    if (e.kind === 'link') rows.push(['URL', e.url], ['Title', e.title]);
    if (e.kind === 'image') rows.push(['Dimensions', `${e.w} × ${e.h}`]);
    if (e.kind === 'file') rows.push(['Path', e.path], ['Size', e.size]);
    rows.push(['Copied', stamp.format(e.at)]);
    detail.innerHTML = `<div class="clip-preview">${preview}</div><div class="clip-info"><p class="clip-info-h" id="clipInfoH">Information</p><dl aria-labelledby="clipInfoH">${rows.map(([k, v, icon]) =>
      `<div><dt>${k}</dt><dd>${icon ? `<img src="${BASE}${icon}" alt="">` : ''}<span title="${esc(v)}">${esc(v)}</span></dd></div>`).join('')}</dl></div>`;
  }

  const select = (id) => { selectedId = id; showSelection(undefined, true); };
  function move(by) {
    const shown = filtered();
    if (!shown.length) return;
    const at = Math.max(0, shown.findIndex((e) => e.id === selectedId));
    select(shown[Math.min(Math.max(at + by, 0), shown.length - 1)].id);
  }

  /* ---------- shared actions ---------- */
  // Copying puts the entry back on top, with a brief "Copied" where its time was.
  function copy(e) {
    if (!e) return;
    entries = [{ ...e, at: Date.now() }, ...entries.filter((x) => x.id !== e.id)];
    copiedId = e.id;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copiedId = null; render(); }, 1200);
    render();
    say(`Copied ${summary(e)}`);
  }
  function remove(e) {
    entries = entries.filter((x) => x.id !== e.id);
    render();
    say(`Removed ${summary(e)}`);
  }
  // Delete in the window selects the next match, or the one before it.
  function deleteSelected() {
    const shown = filtered(), sel = selected(shown);
    if (!sel) return;
    const i = shown.indexOf(sel);
    selectedId = (shown[i + 1] || shown[i - 1])?.id || null;
    remove(sel);
  }
  function reset() { entries = samples(); selectedId = null; render(); say('Sample history restored'); }

  /* ---------- card ---------- */
  function renderCard() {
    const focus = card.contains(document.activeElement) ? [document.activeElement.dataset.id, document.activeElement.dataset.act] : null;
    const hidden = entries.length - 5;
    card.innerHTML = `<div class="hrow"><span class="ctitle">Clipboard</span>${entries.length ? `<span class="mut tnum">${entries.length} copied</span>` : ''}</div>` +
      (entries.length ? `<ul class="cb-rows">${entries.slice(0, 5).map((e) => `<li class="cb-row">
        <button type="button" class="cb-copy" data-id="${e.id}" data-act="copy" aria-label="Copy ${esc(summary(e))}">${thumb(e)}<span><span class="cb-prev">${esc(excerpt(e))}</span>${e.id === copiedId
          ? '<span class="cb-time mut ok">Copied</span>' : `<span class="cb-time mut">${ago(e.at)}</span>`}</span></button>
        <button type="button" class="cb-x" data-id="${e.id}" data-act="remove" aria-label="Remove ${esc(summary(e))}">${X}</button></li>`).join('')}</ul>`
      : '<p class="cb-empty">Copy something and it appears here.</p><button type="button" class="pill" data-reset>Undo demo</button>') +
      `<div class="hrow cb-foot mut"><span>${hidden > 0 ? `${hidden} more in the history` : 'Click the icon for search and previews'}</span><a class="cb-all" href="#clipboard">Show All</a></div>`;
    if (!focus) return;
    // Keep keyboard focus through the redraw, on the same control where it still exists.
    const [id, act] = focus;
    (card.querySelector(`[data-id="${id}"][data-act="${act}"]`) || card.querySelector('.cb-copy, [data-reset], .cb-all')).focus();
  }

  function render() { renderList(); renderCard(); }

  /* ---------- input ---------- */
  function keys(ev) {
    const cmd = ev.metaKey || ev.ctrlKey;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') move(ev.key === 'ArrowDown' ? 1 : -1);
    else if ((ev.key === 'Home' || ev.key === 'End') && ev.currentTarget === list) { const s = filtered(); if (s.length) select((ev.key === 'Home' ? s[0] : s.at(-1)).id); }
    else if (ev.key === 'Enter') copy(selected());
    else if (cmd && ev.key === 'Backspace') deleteSelected();
    else if (ev.key === 'Escape' && search.value) { search.value = ''; renderList(); }
    else return;
    ev.preventDefault();
  }
  search.addEventListener('keydown', keys);
  list.addEventListener('keydown', keys);
  search.addEventListener('input', () => { renderList(); say(`${filtered().length} entries`); });
  type.addEventListener('change', () => { renderList(); say(`${filtered().length} entries`); });
  // Click selects; a second click copies, like the app's list.
  list.addEventListener('click', (ev) => {
    const o = ev.target.closest('[role="option"]');
    if (!o) return;
    if (ev.detail === 2) copy(entries.find((e) => e.id === o.dataset.id));
    else select(o.dataset.id);
  });
  copyBtn.addEventListener('click', () => copy(selected()));
  deleteBtn.addEventListener('click', deleteSelected);
  $('clipWindow').addEventListener('click', (ev) => { if (ev.target.closest('[data-reset]')) { reset(); list.focus(); } });
  card.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) {
      // Show All opens the full window: the page scrolls there and the search is ready for typing.
      if (ev.target.closest('.cb-all') && matchMedia('(hover: hover)').matches) search.focus({ preventScroll: true });
      return;
    }
    if (b.hasAttribute('data-reset')) { reset(); card.querySelector('.cb-copy')?.focus(); return; }
    const e = entries.find((x) => x.id === b.dataset.id);
    if (!e) return;
    if (b.dataset.act === 'copy') copy(e);
    else {
      const rows = [...card.querySelectorAll('.cb-copy')];
      const index = rows.findIndex((r) => r.dataset.id === e.id);
      remove(e);
      (card.querySelectorAll('.cb-copy')[index] || card.querySelectorAll('.cb-copy')[index - 1] || card.querySelector('[data-reset]'))?.focus();
    }
  });
  render();
})();

