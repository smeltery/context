// @ts-nocheck
export function initStatsWidgets() {
  const BASE = '/icons/';
  const $ = (id) => document.getElementById(id);
  const mini = (items, size) => { const d = window.ContextDock.render({ base: BASE, items, lazy: true }); d.style.fontSize = size + 'px'; return d; };

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
  const setP = () => { playBtn.innerHTML = playing ? PAUSE : PLAY; playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play'); window.ContextDock.setPlaying(pcell, playing); };
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


}
