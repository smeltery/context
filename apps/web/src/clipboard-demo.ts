// @ts-nocheck
/* Clipboard: the widget card and the History window share one sample history, as they do in the app
   (lateraldock/Sources/Widgets/Clipboard). A local sample: it never reads or writes the visitor's clipboard. */
export function initClipboardDemo() {
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
}
