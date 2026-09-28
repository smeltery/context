// @ts-nocheck
export function initHeroZoom() {
  const lenis = new window.Lenis({ autoRaf: true, anchors: true, lerp: 0.06 });
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

  const ITEMS = window.ContextDock.DEFAULT.slice();
  ITEMS.splice(ITEMS.findIndex((i) => i.id === 'chatgpt') + 1, 0, { type: 'app', id: 'figma', icon: 'figma.png', name: 'Figma, temporary', minutes: 60 });
  const byId = (id) => ITEMS.find((x) => x.id === id);
  const dock = window.ContextDock.render({ base: BASE, items: ITEMS });
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
    const mini = window.ContextDock.render({ base: BASE, items });
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
    if (nearPlayer !== playing) { playing = nearPlayer; window.ContextDock.setPlaying(player, playing); }

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
}
