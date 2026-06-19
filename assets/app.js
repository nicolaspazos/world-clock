/* ============================================================
   Glint · Global Sales Clock — application logic
   - DST-correct time via Intl (no offset tables to rot)
   - Live D3 world map + day/night terminator
   - Business-hours intelligence + overlap planner strips
   - localStorage persistence
   ============================================================ */
'use strict';

/* ---------- search helpers (accent-insensitive + country aliases) ---------- */
// Lower-case and strip diacritics so "sao paulo" matches "São Paulo", etc.
const _norm = s => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
// Common alternate names → so "USA", "UK", "Emirates", "Holland", "Korea" all hit.
const COUNTRY_ALIASES = {
  'United States': 'usa us america united states',
  'United Kingdom': 'uk britain great britain england',
  'UAE': 'uae emirates united arab emirates',
  'Saudi Arabia': 'ksa saudi',
  'South Korea': 'korea rok',
  'South Africa': 'rsa',
  'Czechia': 'czech republic',
  'Netherlands': 'holland',
  'Türkiye': 'turkey turkiye',
  'Germany': 'deutschland',
  'Spain': 'espana',
  'Italy': 'italia',
  'Brazil': 'brasil',
  'China': 'prc mainland',
  'Hong Kong': 'hk',
  'Australia': 'oz aus',
  'New Zealand': 'nz aotearoa',
  'Ireland': 'eire'
};
// Lower score = better match; -1 = no match. Ranks city-name hits above country hits.
function scoreCity(c, q){
  if(!q) return 0;
  const cc = c.cc.toLowerCase();
  if(cc === q) return 0;                                   // exact country code (e.g. "sg", "au")
  const city = _norm(c.city);
  const hay = _norm(`${c.city} ${c.country} ${COUNTRY_ALIASES[c.country] || ''}`);
  const tokens = hay.split(/\s+/);
  if(city.startsWith(q)) return 1;                         // city begins with query
  if(tokens.some(t => t.startsWith(q))) return 2;          // a country/alias/word begins with query
  if(city.includes(q)) return 3;                           // city contains query
  if(hay.includes(q)) return 4;                            // country/alias contains query
  return -1;
}

/* ---------- state ---------- */
const LS_KEY = 'glint.sales.clock.v1';
const byId = Object.fromEntries(CITY_DB.map(c => [c.id, c]));
let state = loadState();
let WORLD = null;
let activeId = null;

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const s = JSON.parse(raw);
      // keep only cities that still exist in the DB
      s.cities = (s.cities || []).filter(c => byId[c.id]);
      if(!s.cities.some(c => c.id === s.home)) s.home = s.cities[0]?.id || DEFAULT_STATE.home;
      return Object.assign(structuredClone(DEFAULT_STATE), s);
    }
  }catch(e){ /* fall through to defaults */ }
  return structuredClone(DEFAULT_STATE);
}
function saveState(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }

/* ---------- time utilities (DST-aware) ---------- */
function zonedParts(tz, date){
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23',
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
  const o = {};
  for(const p of dtf.formatToParts(date)) if(p.type !== 'literal') o[p.type] = p.value;
  const y=+o.year, mo=+o.month, d=+o.day, h=+o.hour, mi=+o.minute, s=+o.second;
  const wallMs = Date.UTC(y, mo-1, d, h, mi, s);
  return { y, mo, d, h, mi, s, wallMs, wd: new Date(wallMs).getUTCDay() };
}
function infoFor(tz, date){
  const p = zonedParts(tz, date);
  const offMin = Math.round((p.wallMs - date.getTime()) / 60000);
  return { p, offMin, hourDec: p.h + p.mi/60 + p.s/3600, dayIdx: Math.floor(p.wallMs/86400000) };
}
function fmtOffset(min){
  const sign = min < 0 ? '−' : '+';
  const a = Math.abs(min), h = Math.floor(a/60), m = a%60;
  return 'UTC' + sign + h + (m ? ':' + String(m).padStart(2,'0') : '');
}
function fmtDiff(min){
  if(min === 0) return 'same hour';
  const sign = min < 0 ? '−' : '+';
  const a = Math.abs(min), h = Math.floor(a/60), m = a%60;
  return sign + h + (m ? ':' + String(m).padStart(2,'0') : '') + 'h';
}
/* Live zone names straight from the device IANA database. These change with the
   rules themselves (e.g. "British Summer Time" ⇄ "Greenwich Mean Time"), so they
   double as visible proof that DST / future changes are being applied. */
function tzAbbrev(tz, date){
  try{
    const parts = new Intl.DateTimeFormat('en-US', { timeZone:tz, hour:'numeric', timeZoneName:'short' }).formatToParts(date);
    const p = parts.find(x => x.type === 'timeZoneName'); return p ? p.value : '';
  }catch(e){ return ''; }
}
function tzLongName(tz, date){
  try{
    const parts = new Intl.DateTimeFormat('en-US', { timeZone:tz, hour:'numeric', timeZoneName:'long' }).formatToParts(date);
    const p = parts.find(x => x.type === 'timeZoneName'); return p ? p.value : '';
  }catch(e){ return ''; }
}
function clockText(p, use24h){
  const mm = String(p.mi).padStart(2,'0'), ss = String(p.s).padStart(2,'0');
  if(use24h) return { t: String(p.h).padStart(2,'0') + ':' + mm + ':' + ss, ap: '' };
  const ap = p.h < 12 ? 'AM' : 'PM';
  let h12 = p.h % 12; if(h12 === 0) h12 = 12;
  return { t: h12 + ':' + mm + ':' + ss, ap };
}
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------- business status ---------- */
const STATUS_LABEL = {
  open:    'Reach out now',
  edge:    'Edge of the day',
  closed:  'Off-hours',
  asleep:  'Likely asleep',
  weekend: 'Weekend'
};
function statusOf(city, info){
  const wkndDays = FRI_SAT_WEEKEND.has(city.cc) ? [5,6] : [6,0];
  if(wkndDays.includes(info.p.wd)) return 'weekend';
  return hourStatus(info.hourDec);
}
function hourStatus(h){
  const { start, end } = state.hours;
  if(h >= start && h < end) return 'open';
  if((h >= start-1 && h < start) || (h >= end && h < end+1)) return 'edge';
  if(h >= 22 || h < 6) return 'asleep';
  return 'closed';
}
const STATUS_RANK = { open:0, edge:1, closed:2, asleep:3, weekend:4 };

/* ---------- solar position (for day/night) ---------- */
function subsolarPoint(date){
  const rad = Math.PI/180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const decl = -23.44 * Math.cos(rad * (360/365) * (dayOfYear + 10));
  const B = rad * (360/365) * (dayOfYear - 81);
  const eot = 9.87*Math.sin(2*B) - 7.53*Math.cos(B) - 1.5*Math.sin(B); // minutes
  const utcH = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
  let lng = -15 * (utcH - 12 + eot/60);
  lng = ((lng + 540) % 360) - 180;
  return { lat: decl, lng };
}
function angularDist(aLat, aLng, bLat, bLng){
  const rad = Math.PI/180;
  const s = Math.sin(aLat*rad)*Math.sin(bLat*rad) +
            Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.cos((bLng-aLng)*rad);
  return Math.acos(Math.max(-1, Math.min(1, s))) / rad;
}
function isDaylight(lat, lng, sp){ return angularDist(lat, lng, sp.lat, sp.lng) < 90; }

const SUN_SVG = '<svg class="dn" viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="4" fill="#ffd27a"/><g stroke="#ffd27a" stroke-width="1.7" stroke-linecap="round"><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6"/></g></svg>';
const MOON_SVG = '<svg class="dn" viewBox="0 0 24 24" width="13" height="13"><path d="M21 13A8.2 8.2 0 1 1 11 3a6.4 6.4 0 0 0 10 10Z" fill="#9aa6e0"/></svg>';

/* ============================================================
   MAP  (D3 + TopoJSON, vendored)
   ============================================================ */
const svg = d3.select('#map');
const stageEl = document.querySelector('.map-stage');
const tipEl = document.getElementById('mapTip');
let projection, path, zoomLayer, pinLayer, gNight, gSun, zoomBehavior;
let currentTransform = d3.zoomIdentity;
const pinBase = {}; // id -> [x,y] in base (un-transformed) coords

async function initMap(){
  try{
    const res = await fetch('vendor/countries-110m.json', { cache:'force-cache' });
    WORLD = await res.json();
  }catch(e){
    stageEl.insertAdjacentHTML('beforeend',
      '<div class="map-hint" style="left:50%;top:50%;transform:translate(-50%,-50%);right:auto">Map data unavailable offline — clocks still work.</div>');
    return;
  }
  buildMap();
  window.addEventListener('resize', debounce(buildMap, 180));
}

function mapSize(){
  const r = svg.node().getBoundingClientRect();
  return [Math.max(320, r.width), Math.max(320, r.height)];
}

function buildMap(){
  if(!WORLD) return;
  const [W, H] = mapSize();
  svg.attr('viewBox', `0 0 ${W} ${H}`).selectAll('*').remove();

  projection = d3.geoEquirectangular().fitExtent([[4,8],[W-4,H-8]], { type:'Sphere' });
  path = d3.geoPath(projection);

  const defs = svg.append('defs');
  const glow = defs.append('radialGradient').attr('id','sunGlow');
  glow.append('stop').attr('offset','0%').attr('stop-color','rgba(255,210,122,0.55)');
  glow.append('stop').attr('offset','100%').attr('stop-color','rgba(255,210,122,0)');

  zoomLayer = svg.append('g');
  zoomLayer.append('path').attr('class','sphere').attr('d', path({type:'Sphere'}));
  zoomLayer.append('path').attr('class','graticule').attr('d', path(d3.geoGraticule10()));
  zoomLayer.append('path').attr('class','land')
    .attr('d', path(topojson.feature(WORLD, WORLD.objects.countries)));
  gSun = zoomLayer.append('circle').attr('class','sun-glow').attr('r', 46).attr('fill','url(#sunGlow)');
  gNight = zoomLayer.append('path').attr('class','night');

  pinLayer = svg.append('g').attr('class','pin-layer');

  zoomBehavior = d3.zoom().scaleExtent([1, 9])
    .translateExtent([[0,0],[W,H]]).extent([[0,0],[W,H]])
    .on('zoom', (ev) => { currentTransform = ev.transform; zoomLayer.attr('transform', ev.transform); placePins(); })
    .on('start', () => svg.classed('grabbing', true))
    .on('end',   () => svg.classed('grabbing', false));
  svg.call(zoomBehavior).on('dblclick.zoom', null);

  currentTransform = d3.zoomIdentity;
  drawTerminator(new Date());
  syncPins();
}

function drawTerminator(now){
  if(!gNight) return;
  const sp = subsolarPoint(now);
  const anti = [ ((sp.lng + 360) % 360) - 180 + 180, -sp.lat ];
  if(anti[0] > 180) anti[0] -= 360;
  const night = d3.geoCircle().center(anti).radius(90)();
  gNight.attr('d', path(night));
  const sc = projection([sp.lng, sp.lat]);
  if(sc) gSun.attr('cx', sc[0]).attr('cy', sc[1]).attr('display', null);
  else gSun.attr('display','none');
}

/* create / remove pin nodes to match state.cities */
function syncPins(){
  if(!pinLayer) return;
  const sel = pinLayer.selectAll('g.pin').data(state.cities.map(c => c.id), d => d);
  sel.exit().remove();
  const enter = sel.enter().append('g').attr('class','pin')
    .on('mouseenter', (ev, id) => { setActive(id); showTip(id); })
    .on('mouseleave', () => { setActive(null); hideTip(); })
    .on('click', (ev, id) => { scrollToCard(id); });
  enter.append('circle').attr('class','halo').attr('r', 9);
  enter.append('circle').attr('class','core').attr('r', 4.2);
  enter.append('circle').attr('class','ring').attr('r', 7).attr('display','none');
  enter.append('text').attr('class','pin-label').attr('x', 0).attr('y', -12)
    .attr('text-anchor','middle').attr('display','none');
  placePins();
  colorPins(new Date());
}

function placePins(){
  if(!pinLayer || !projection) return;
  pinLayer.selectAll('g.pin').each(function(id){
    const c = byId[id];
    let b = pinBase[id];
    if(!b){ b = projection([c.lng, c.lat]); pinBase[id] = b; }
    const p = currentTransform.apply(b);
    d3.select(this).attr('transform', `translate(${p[0]},${p[1]})`);
  });
}
function refreshPinBase(){ for(const k in pinBase) delete pinBase[k]; placePins(); }

function colorPins(now){
  if(!pinLayer) return;
  const sp = subsolarPoint(now);
  pinLayer.selectAll('g.pin').each(function(id){
    const c = byId[id];
    const entry = state.cities.find(x => x.id === id);
    const st = statusOf(c, infoFor(c.tz, now));
    const g = d3.select(this);
    const cls = 'fill-' + st;
    g.select('.halo').attr('class', 'halo ' + cls).attr('opacity', 0.26);
    g.select('.core').attr('class', 'core ' + cls);
    const pinned = entry?.pinned || id === state.home;
    g.classed('home', id === state.home);
    g.select('.ring').attr('display', pinned ? null : 'none');
    g.select('.pin-label').attr('display', pinned ? null : 'none').text(c.city);
    g.raise();
  });
  if(activeId) pinLayer.select(null); // no-op keep
  applyActivePin();
}

function applyActivePin(){
  if(!pinLayer) return;
  pinLayer.selectAll('g.pin')
    .classed('active', id => id === activeId)
    .classed('dim', id => activeId && id !== activeId);
}

/* tooltip */
function showTip(id){
  const c = byId[id];
  const now = new Date();
  const info = infoFor(c.tz, now);
  const st = statusOf(c, info);
  const ct = clockText(info.p, state.use24h);
  tipEl.innerHTML =
    `<div class="tt-city">${c.city}</div>` +
    `<div class="tt-country">${c.country}</div>` +
    `<div class="tt-time">${ct.t}${ct.ap ? ' <small style="font-size:11px;color:var(--muted)">'+ct.ap+'</small>' : ''}</div>` +
    `<div class="tt-zone">${fmtOffset(info.offMin)} · ${tzLongName(c.tz, now)}</div>` +
    `<div class="tt-status s-${st}">${STATUS_LABEL[st]}</div>`;
  const pinNode = pinLayer.selectAll('g.pin').filter(d => d === id).node();
  if(!pinNode){ return; }
  const r = pinNode.getBoundingClientRect();
  const s = stageEl.getBoundingClientRect();
  tipEl.hidden = false;
  tipEl.style.left = (r.left + r.width/2 - s.left) + 'px';
  tipEl.style.top  = (r.top - s.top) + 'px';
}
function hideTip(){ tipEl.hidden = true; }

/* ============================================================
   CARDS
   ============================================================ */
const cardsEl = document.getElementById('cards');
const refs = {}; // id -> element refs

function visibleCities(){
  let list = state.cities.slice();
  const now = new Date();
  const enrich = list.map(entry => {
    const c = byId[entry.id];
    const info = infoFor(c.tz, now);
    return { entry, c, info, st: statusOf(c, info) };
  });
  if(document.getElementById('reachOnly').checked){
    return enrich.filter(x => x.st === 'open' || x.st === 'edge').sort(sortComparator);
  }
  return enrich.sort(sortComparator);
}
function sortComparator(a, b){
  if(state.sort === 'pinned'){
    const ah = a.c.id === state.home ? 0 : 1, bh = b.c.id === state.home ? 0 : 1;
    if(ah !== bh) return ah - bh;
    const ap = a.entry.pinned ? 0 : 1, bp = b.entry.pinned ? 0 : 1;
    if(ap !== bp) return ap - bp;
    return state.cities.indexOf(a.entry) - state.cities.indexOf(b.entry);
  }
  if(state.sort === 'time') return a.info.hourDec - b.info.hourDec;
  if(state.sort === 'reach'){
    if(STATUS_RANK[a.st] !== STATUS_RANK[b.st]) return STATUS_RANK[a.st] - STATUS_RANK[b.st];
    return a.info.hourDec - b.info.hourDec;
  }
  return 0;
}

function syncCards(){
  const list = visibleCities();
  const wanted = new Set(list.map(x => x.c.id));
  // remove
  for(const id in refs){ if(!wanted.has(id)){ refs[id].root.remove(); delete refs[id]; } }
  // create + order
  list.forEach((x, i) => {
    if(!refs[x.c.id]) createCard(x.c, i);
    cardsEl.appendChild(refs[x.c.id].root); // moves into order
  });
  document.getElementById('cardCount').textContent = state.cities.length;
  const empty = list.length === 0;
  document.getElementById('emptyNote').hidden = !empty;
  updateSlow(new Date(), true);
  updateClocks(new Date());
  applyActiveCard();
}

function createCard(c, index){
  const home = c.id === state.home;
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = c.id;
  el.style.animationDelay = (index * 40) + 'ms';
  el.innerHTML = `
    <div class="card-top">
      <div class="card-id">
        <div class="card-city"><span class="dn-slot"></span><span class="cname">${c.city}</span></div>
        <div class="card-sub">
          <span class="cc-chip">${c.cc}</span>
          <span class="card-country">${c.country}</span>
          <span class="day-tag-slot"></span>
        </div>
      </div>
      <div class="card-actions">
        <button class="icon-btn pin-btn" title="Pin / lock this city" aria-label="Pin">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3.3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.4 1-5.8L3.6 9.4l5.8-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn del-btn" title="Remove" aria-label="Remove">
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="card-note"></div>
    <div class="card-clock"><span class="clock-time">--:--:--</span><span class="clock-ampm"></span></div>
    <div class="card-meta">
      <span class="meta-pill offset">UTC</span>
      <span class="meta-pill diff">Δ <b>—</b></span>
    </div>
    <div class="status-row"><span class="status-badge"><i class="bdot"></i><span class="sb-label">—</span></span></div>
    <div class="strip-slot"></div>`;

  refs[c.id] = {
    root: el,
    dn: el.querySelector('.dn-slot'),
    note: el.querySelector('.card-note'),
    time: el.querySelector('.clock-time'),
    ampm: el.querySelector('.clock-ampm'),
    offset: el.querySelector('.offset'),
    diff: el.querySelector('.diff b'),
    badge: el.querySelector('.status-badge'),
    sbLabel: el.querySelector('.sb-label'),
    dayTag: el.querySelector('.day-tag-slot'),
    strip: el.querySelector('.strip-slot')
  };

  // home: lock controls
  const pinBtn = el.querySelector('.pin-btn'), delBtn = el.querySelector('.del-btn');
  if(home){ pinBtn.classList.add('pinned'); pinBtn.title = 'Home — always pinned'; delBtn.style.display = 'none'; }

  pinBtn.addEventListener('click', (e) => { e.stopPropagation(); if(!home) togglePin(c.id); });
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeCity(c.id); });
  el.addEventListener('mouseenter', () => { setActive(c.id); });
  el.addEventListener('mouseleave', () => { setActive(null); });
}

function updateClocks(now){
  for(const id in refs){
    const c = byId[id];
    const info = infoFor(c.tz, now);
    const ct = clockText(info.p, state.use24h);
    refs[id].time.textContent = ct.t;
    refs[id].ampm.textContent = ct.ap;
  }
  // home readout
  const hc = byId[state.home];
  const hi = infoFor(hc.tz, now);
  const ct = clockText(hi.p, state.use24h);
  document.getElementById('homeClock').textContent = ct.t + (ct.ap ? ' ' + ct.ap : '');
  document.getElementById('homeDate').textContent =
    WD[hi.p.wd] + ' ' + hi.p.d + ' ' + MO[hi.p.mo-1] + ' · ' + fmtOffset(hi.offMin);
  document.getElementById('homeCity').textContent = hc.city;
}

let lastMinute = -1;
function updateSlow(now, force){
  const home = byId[state.home];
  const homeInfo = infoFor(home.tz, now);
  for(const id in refs){
    const c = byId[id];
    const r = refs[id];
    const info = infoFor(c.tz, now);
    const sp = subsolarPoint(now);
    const st = statusOf(c, info);

    r.root.className = 'card s-' + st + (id === activeId ? ' active' : '');
    r.dn.innerHTML = isDaylight(c.lat, c.lng, sp) ? SUN_SVG : MOON_SVG;
    r.sbLabel.textContent = STATUS_LABEL[st];
    r.badge.className = 'status-badge s-' + st;

    const abbr = tzAbbrev(c.tz, now);
    r.offset.textContent = fmtOffset(info.offMin) + (abbr && !/^(GMT|UTC)/i.test(abbr) ? ' · ' + abbr : '');

    const dh = info.offMin - homeInfo.offMin;
    r.diff.textContent = (id === state.home) ? 'you' : fmtDiff(dh);

    const dayDelta = info.dayIdx - homeInfo.dayIdx;
    if(dayDelta > 0)      r.dayTag.innerHTML = '<span class="day-tag next">Tomorrow</span>';
    else if(dayDelta < 0) r.dayTag.innerHTML = '<span class="day-tag prev">Yesterday</span>';
    else                  r.dayTag.innerHTML = '';

    const entry = state.cities.find(x => x.id === id);
    r.note.textContent = entry?.note || '';

    const pinBtn = r.root.querySelector('.pin-btn');
    if(id !== state.home) pinBtn.classList.toggle('pinned', !!entry?.pinned);

    r.strip.innerHTML = stripHTML(info, homeInfo, st);
  }
  if(WORLD){ drawTerminator(now); colorPins(now); }
  lastMinute = now.getMinutes();
}

/* day-part overlap strip */
function stripHTML(info, homeInfo, st){
  let cells = '';
  for(let h=0; h<24; h++) cells += `<i class="${'h-'+hourStatus(h)}"></i>`;
  const nowLeft = (info.hourDec / 24) * 100;

  // your working window mapped onto their clock
  const diffH = (info.offMin - homeInfo.offMin) / 60;
  const mod = (n) => ((n % 24) + 24) % 24;
  const ys = mod(state.hours.start + diffH), ye = mod(state.hours.end + diffH);
  let youBands = '';
  const band = (l, w) => `<span class="strip-you" style="left:${l/24*100}%;width:${w/24*100}%"></span>`;
  if(ye > ys) youBands = band(ys, ye - ys);
  else youBands = band(ys, 24 - ys) + band(0, ye);

  const dimmed = (st === 'weekend') ? ' style="opacity:.4"' : '';
  return `<div class="strip">
      <div class="strip-bar"${dimmed}>${cells}${youBands}<span class="strip-now" style="left:${nowLeft}%"></span></div>
      <div class="strip-legend"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>
      <div class="strip-cap">Dashed = your <b>${pad2(state.hours.start)}–${pad2(state.hours.end)}</b> in their time · white = now</div>
    </div>`;
}
function pad2(n){ return String(n).padStart(2,'0'); }

/* ---------- active link (card <-> pin) ---------- */
function setActive(id){ activeId = id; applyActiveCard(); applyActivePin(); }
function applyActiveCard(){
  for(const id in refs) refs[id].root.classList.toggle('active', id === activeId);
}
function scrollToCard(id){
  const r = refs[id];
  if(!r){ // not visible (filtered) — clear filter
    document.getElementById('reachOnly').checked = false; syncCards();
  }
  const el = refs[id]?.root;
  if(el){ el.scrollIntoView({ behavior:'smooth', block:'center' });
    el.animate([{boxShadow:'0 0 0 2px rgba(245,177,61,.9)'},{boxShadow:'0 0 0 1px rgba(245,177,61,0)'}],{duration:900}); }
}

/* ============================================================
   ACTIONS
   ============================================================ */
function togglePin(id){
  const e = state.cities.find(x => x.id === id);
  if(e){ e.pinned = !e.pinned; saveState(); syncCards(); }
}
function removeCity(id){
  if(id === state.home) return;
  state.cities = state.cities.filter(x => x.id !== id);
  if(WORLD) syncPins();
  saveState(); syncCards();
}
function addCity(id){
  if(state.cities.some(x => x.id === id)) return;
  state.cities.push({ id, pinned:false, note:'' });
  if(WORLD) syncPins();
  saveState(); syncCards();
  refreshPinBase();
}
function resetDefaults(){
  if(!confirm('Reset to your default markets? Cities you added will be removed.')) return;
  state = structuredClone(DEFAULT_STATE);
  saveState();
  for(const id in refs){ refs[id].root.remove(); delete refs[id]; }
  if(WORLD) syncPins();
  syncControls(); syncCards(); refreshPinBase();
}

/* ============================================================
   CONTROLS
   ============================================================ */
function syncControls(){
  document.getElementById('fmtBtn').textContent = state.use24h ? '24h' : '12h';
  document.getElementById('hoursLabel').textContent = pad2(state.hours.start) + '–' + pad2(state.hours.end);
  document.getElementById('sortSel').value = state.sort;
  document.getElementById('homeCity').textContent = byId[state.home].city;
  document.getElementById('hoursHomeName').textContent = byId[state.home].city;
}

function bindControls(){
  document.getElementById('fmtBtn').addEventListener('click', () => {
    state.use24h = !state.use24h; saveState(); syncControls(); updateClocks(new Date());
  });
  document.getElementById('sortSel').addEventListener('change', (e) => {
    state.sort = e.target.value; saveState(); syncCards();
  });
  document.getElementById('reachOnly').addEventListener('change', syncCards);
  document.getElementById('resetBtn').addEventListener('click', resetDefaults);

  // add-city palette
  const scrim = document.getElementById('paletteScrim');
  const search = document.getElementById('paletteSearch');
  const results = document.getElementById('paletteResults');
  let selIdx = 0, matches = [];

  function openPalette(){ scrim.hidden = false; search.value = ''; renderResults(''); search.focus(); }
  function closePalette(){ scrim.hidden = true; }
  function renderResults(q){
    const has = new Set(state.cities.map(c => c.id));
    const norm = _norm(q);
    const scored = [];
    CITY_DB.forEach((c, i) => {
      const s = norm ? scoreCity(c, norm) : 0;
      if(s >= 0) scored.push({ c, s, i });
    });
    scored.sort((a, b) => a.s - b.s || a.i - b.i);   // best match first, then DB order
    matches = scored.slice(0, 80).map(x => x.c);
    selIdx = 0;
    if(!matches.length){ results.innerHTML = '<li class="r-none">No match. Try another city or country.</li>'; return; }
    results.innerHTML = matches.map((c, i) =>
      `<li data-id="${c.id}" class="${i===0?'sel':''}">
        <span class="r-city">${c.city}</span><span class="r-country">${c.country}</span>
        ${has.has(c.id) ? '<span class="r-added">✓ added</span>' : `<span class="r-tz">${c.tz.split('/').pop().replace(/_/g,' ')}</span>`}
      </li>`).join('');
  }
  function choose(i){
    const c = matches[i]; if(!c) return;
    if(!state.cities.some(x => x.id === c.id)) addCity(c.id);
    closePalette();
  }
  document.getElementById('addBtn').addEventListener('click', openPalette);
  scrim.addEventListener('click', (e) => { if(e.target === scrim) closePalette(); });
  search.addEventListener('input', () => renderResults(search.value));
  search.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closePalette();
    else if(e.key === 'ArrowDown'){ e.preventDefault(); selIdx = Math.min(selIdx+1, matches.length-1); markSel(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); selIdx = Math.max(selIdx-1, 0); markSel(); }
    else if(e.key === 'Enter'){ e.preventDefault(); choose(selIdx); }
  });
  function markSel(){
    [...results.children].forEach((li, i) => li.classList.toggle('sel', i === selIdx));
    results.children[selIdx]?.scrollIntoView({ block:'nearest' });
  }
  results.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]'); if(!li) return;
    const i = matches.findIndex(m => m.id === li.dataset.id); choose(i);
  });

  // hours popover
  const hScrim = document.getElementById('hoursScrim');
  const hStart = document.getElementById('hoursStart'), hEnd = document.getElementById('hoursEnd');
  document.getElementById('hoursBtn').addEventListener('click', () => {
    hStart.value = state.hours.start; hEnd.value = state.hours.end; hScrim.hidden = false; hStart.focus();
  });
  document.getElementById('hoursCancel').addEventListener('click', () => hScrim.hidden = true);
  hScrim.addEventListener('click', (e) => { if(e.target === hScrim) hScrim.hidden = true; });
  document.getElementById('hoursSave').addEventListener('click', () => {
    let s = Math.max(0, Math.min(23, parseInt(hStart.value, 10) || 0));
    let en = Math.max(s+1, Math.min(24, parseInt(hEnd.value, 10) || 24));
    state.hours = { start:s, end:en }; saveState(); syncControls(); updateSlow(new Date(), true); hScrim.hidden = true;
  });

  // keyboard shortcut: A to add
  document.addEventListener('keydown', (e) => {
    if(e.key === 'a' && !/input|textarea|select/i.test(document.activeElement.tagName) && scrim.hidden){
      e.preventDefault(); openPalette();
    }
  });
}

/* ============================================================
   LOOP + INIT
   ============================================================ */
function tick(){
  const now = new Date();
  updateClocks(now);
  if(now.getMinutes() !== lastMinute) updateSlow(now, false);
  if(!tipEl.hidden && activeId) showTip(activeId);
  const ms = 1000 - (now.getMilliseconds());
  setTimeout(tick, Math.max(120, ms));
}
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ---- timezone self-verification ----
   Confirms (a) every IANA zone in the DB resolves on THIS device, catching a zone
   that a future tzdata update renamed/removed before it can show a wrong time, and
   (b) the device actually applies DST (New York winter vs summer must differ),
   catching a badly out-of-date device. Surfaced as a header health chip. */
function auditTimezones(){
  const zones = [...new Set(CITY_DB.map(c => c.tz))];
  const bad = [];
  for(const z of zones){
    try{ new Intl.DateTimeFormat('en-US', { timeZone:z }).format(new Date()); }
    catch(e){ bad.push(z); }
  }
  const y = new Date().getUTCFullYear();
  const jan = infoFor('America/New_York', new Date(Date.UTC(y, 0, 15))).offMin;
  const jul = infoFor('America/New_York', new Date(Date.UTC(y, 6, 15))).offMin;
  return { bad, dstOk: jan !== jul, total: zones.length };
}
function updateTzHealth(){
  const el = document.getElementById('tzHealth');
  if(!el) return;
  const txt = document.getElementById('tzHealthText');
  const a = auditTimezones();
  if(a.bad.length === 0 && a.dstOk){
    el.className = 'tz-health ok';
    txt.textContent = 'Live TZ';
    el.title = `All ${a.total} timezones verified against your device's IANA database. `
      + `Times are computed live, so daylight-saving and any future rule changes apply automatically — `
      + `just keep your computer/phone OS and browser updated to receive the latest rules. `
      + `Checked ${new Date().toLocaleString()}.`;
  } else {
    el.className = 'tz-health warn';
    txt.textContent = a.dstOk ? `${a.bad.length} zone(s) to check` : 'Update device';
    el.title = !a.dstOk
      ? 'Heads up: this device did not apply a known daylight-saving rule (New York winter vs summer matched). '
        + 'Your timezone data is likely out of date — update your OS and browser, then reload.'
      : 'These zones were not recognized by this device and may be outdated: ' + a.bad.join(', ')
        + '. Update your OS and browser, then reload.';
  }
}

function boot(){
  syncControls();
  bindControls();
  syncCards();
  updateClocks(new Date());
  updateTzHealth();
  initMap();
  tick();
  // fade the map hint after a bit
  setTimeout(() => { const h = document.getElementById('mapHint'); if(h) h.style.opacity = '0'; }, 6000);
}
boot();
