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

}
