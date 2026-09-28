// @ts-nocheck
export function initChrome() {
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
}
