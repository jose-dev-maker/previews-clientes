// Delfin Charters preview: interactions and scroll-linked 3D. No dependencies.
// Every effect starts from content that is already visible without JavaScript.
// A classic script (not a module) so the page also works when opened straight from the disk.
(function () {
'use strict';
window.__delfinReady = true;

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const phone = matchMedia('(max-width: 700px)');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------------ routes (shared with the chart) */
const BOOK = {
  pigs: 'https://rezbs.com/wp/95bf1ca6d4d777f996f608d5fd042605',
  turtles: 'https://rezbs.com/wp/5685f827f36e440485702f541f180a45',
  beach: 'https://rezbs.com/wp/628aa9f77d524c1a4d55692ba9f3cab8',
  forty: 'https://rezbs.com/wp/92081f8789c4cb3a300427b4a39065ba',
  exuma: 'https://rezbs.com/wp/3ed5b3205f90c79e09d4862505fd0c5f',
  eleuthera: 'https://rezbs.com/wp/ec17cb29db14ff01d07919ce30fec95b',
};
const ROUTES = {
  rose: {
    book: BOOK.pigs, bookLabel: 'Book this trip', distance: 'About 20 nautical miles there and back, 3 hours',
    stops: [
      { place: 'frogs', name: 'Nassau Harbour', desc: 'Pickup at Señor Frog’s or Margaritaville', pickup: true },
      { place: 'greencay', name: 'Green Cay', desc: 'Snorkel with sea turtles over the reef', time: '1 hr 15 min' },
      { place: 'rose', name: 'Rose Island', desc: 'Feed and swim with the pigs, then the beach bar', time: '1 hr 15 min' },
      { place: 'frogs', name: 'Back to Nassau', desc: 'In good time for your ship', end: true },
    ],
  },
  beachbar: {
    book: BOOK.beach, bookLabel: 'Book this trip', distance: 'About 19 nautical miles there and back, 4 hours',
    stops: [
      { place: 'frogs', name: 'Nassau Harbour', desc: 'Everyone aboard, music on', pickup: true },
      { place: 'rose', name: 'Rose Island beach bar', desc: 'Tiki huts, sand and music' },
      { place: 'floating', name: 'Hideaway floating bar', desc: 'A bar deck out on the water', approx: true },
      { place: 'frogs', name: 'Back to Nassau', desc: 'Four hours after you left', end: true },
    ],
  },
  private: {
    book: BOOK.forty, bookLabel: 'Book the 40-ft', distance: 'About 21 nautical miles, 4 or 8 hours, your order',
    stops: [
      { place: 'frogs', name: 'Nassau Harbour', desc: 'The boat is yours for the day', pickup: true },
      { place: 'athol', name: 'Athol Island', desc: 'Calm water and a quiet beach' },
      { place: 'sandy', name: 'Sandy Cay', desc: 'A private beach stop' },
      { place: 'greencay', name: 'Green Cay', desc: 'Snorkel the reef with the turtles' },
      { place: 'rose', name: 'Rose Island', desc: 'Pigs and Footprints beach bar, admission extra' },
      { place: 'floating', name: 'Floating bar', desc: 'One more round on the water', approx: true },
      { place: 'frogs', name: 'Back to Nassau', desc: 'When you’re ready', end: true },
    ],
  },
  exuma: {
    book: BOOK.exuma, bookLabel: 'Book Exuma', distance: 'About 160 nautical miles on the water, a full day',
    stops: [
      { place: 'frogs', name: 'Nassau', desc: 'Across the bank by speedboat', time: '1 hr', pickup: true },
      { place: 'allen', name: 'Allen Cay', desc: 'Feed grapes to the Exuma iguanas', time: '1 hr' },
      { place: 'compass', name: 'Compass Cay', desc: 'Swim with nurse sharks', time: '1 hr' },
      { place: 'pigbeach', name: 'Pig Beach, Big Major Cay', desc: 'The famous swimming pigs', time: '1 hr' },
      { place: 'staniel', name: 'Staniel Cay', desc: 'Lunch at a beach bar', time: '2 hr' },
      { place: 'warderick', name: 'Exuma Land and Sea Park', desc: 'Cruise back through the cays', time: '2 hr' },
      { place: 'frogs', name: 'Nassau', desc: 'Sunset on the way home, if you’re lucky', end: true },
    ],
  },
  eleuthera: {
    book: BOOK.eleuthera, bookLabel: 'Book Eleuthera', distance: 'About 118 nautical miles on the water, a full day',
    stops: [
      { place: 'frogs', name: 'Nassau', desc: 'An hour across to Eleuthera', time: '1 hr', pickup: true },
      { place: 'meeks', name: 'Meeks Patch', desc: 'Swim with the Eleuthera pigs', time: '1 hr', approx: true },
      { place: 'spanish', name: 'Spanish Wells', desc: 'Sea turtles and snorkeling', time: '1 hr 30 min' },
      { place: 'harbour', name: 'Harbour Island', desc: 'Golf cart to Pink Sands, lunch in town', time: '2 hr' },
      { place: 'royal', name: 'Royal Island sandbar', desc: 'Wooden swings and stingrays', time: '1 hr', approx: true },
      { place: 'frogs', name: 'Nassau', desc: 'The hour home across the channel', end: true },
    ],
  },
};

/* ------------------------------------------------------------------ fit giant words */
function fitWidth(el, width) {
  el.style.fontSize = '';
  const fs = parseFloat(getComputedStyle(el).fontSize);
  const w = el.offsetWidth; // layout width, unaffected by 3D transforms
  if (!w || !width) return;
  el.style.fontSize = `${(fs * width) / w}px`;
}
const monument = $('[data-monument]');
const heroPhoto = $('[data-hero-photo]');
const monumentWords = monument ? $$('.monument__word', monument) : [];
const probe = monument ? $('.monument__probe', monumentWords[0]) : null;
const PHOTO = { w: 1920, h: 1280, horizon: 603, focusY: 0.6 };
let capRatio = 0.72;
function measureCap() {
  try {
    const g = document.createElement('canvas').getContext('2d');
    g.font = '800 200px Archivo';
    const m = g.measureText('H');
    if (m.actualBoundingBoxAscent > 50) capRatio = m.actualBoundingBoxAscent / 200;
  } catch (e) { /* keep the default */ }
}
function placeMonument() {
  if (!monument || !heroPhoto || !probe) return;
  const W = heroPhoto.clientWidth, H = heroPhoto.clientHeight;
  if (!W || !H) return;
  monumentWords.forEach((w) => { w.style.fontSize = ''; });
  const fs0 = parseFloat(getComputedStyle(monumentWords[0]).fontSize);
  const w0 = monumentWords[0].offsetWidth;
  const fs = w0 ? (fs0 * W * (phone.matches ? 0.86 : 0.88)) / w0 : fs0;
  monumentWords.forEach((w) => { w.style.fontSize = `${fs}px`; });
  // where the horizon of the photo lands in this box (object-fit: cover, object-position x 60%)
  const sc = Math.max(W / PHOTO.w, H / PHOTO.h);
  const horizon = (H - PHOTO.h * sc) * PHOTO.focusY + PHOTO.horizon * sc;
  const cap = fs * capRatio;
  const top = horizon + cap * 0.24 - probe.offsetTop;
  monument.style.top = `${top}px`;
  monument.style.setProperty('--wl', `${horizon - top}px`);
  heroPhoto.style.setProperty('--hz', `${Math.max(0, horizon)}px`);
}
const giantStack = $('[data-giant-stack]');
const giant = $('[data-giant]');
const email = $('[data-flap]');
const footerWord = $('[data-footer-word]');
function fitAll() {
  placeMonument();
  if (giant && giantStack) {
    const layer = giantStack.firstElementChild;
    layer.style.fontSize = '';
    $$('.giant__layer', giantStack).forEach((l) => { l.style.fontSize = ''; });
    const fs = parseFloat(getComputedStyle(layer).fontSize);
    const w = layer.scrollWidth;
    const size = `${(fs * giant.clientWidth * 0.99) / w}px`;
    $$('.giant__layer', giantStack).forEach((l) => { l.style.fontSize = size; });
  }
  if (email) {
    if (phone.matches) email.style.fontSize = '';
    else { email.style.display = 'inline-block'; fitWidth(email, email.parentElement.clientWidth - parseFloat(getComputedStyle(email.parentElement).paddingLeft) * 2); email.style.display = ''; }
  }
  if (footerWord) {
    footerWord.style.fontSize = '';
    const spans = $$('span', footerWord);
    const fs = parseFloat(getComputedStyle(footerWord).fontSize);
    const sum = spans.reduce((a, s) => a + s.offsetWidth, 0);
    const avail = footerWord.clientWidth;
    if (sum) footerWord.style.fontSize = `${(fs * avail * 0.97) / sum}px`;
  }
}

/* ------------------------------------------------------------------ navigation */
const nav = $('[data-nav]');
const menuBtn = $('[data-menu]');
const sheet = $('[data-sheet]');
function setSheet(open) {
  if (!sheet) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  $('use', menuBtn).setAttribute('href', open ? '#i-close' : '#i-menu');
  if (open) {
    sheet.hidden = false;
    sheet.classList.add('is-opening');
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.remove('is-opening')));
  } else {
    sheet.classList.add('is-closing');
    setTimeout(() => { sheet.hidden = true; sheet.classList.remove('is-closing'); }, reduce ? 0 : 200);
  }
}
menuBtn?.addEventListener('click', () => setSheet(menuBtn.getAttribute('aria-expanded') !== 'true'));
sheet?.addEventListener('click', (e) => { if (e.target.closest('a')) setSheet(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') { setSheet(false); menuBtn.focus(); } });

const navLinks = $$('.nav__links a');
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach((a) => a.classList.toggle('is-here', a.getAttribute('href') === `#${e.target.id}`));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
['trips', 'route', 'private', 'reviews', 'captain', 'dive', 'faq', 'contact'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

/* ------------------------------------------------------------------ entrances */
$$('[data-rise-group]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
monumentWords.forEach((w) => $$('.l, .monument__fin', w).forEach((l, i) => l.style.setProperty('--i', i)));
if (reduce) { try { $('.sprite').pauseAnimations(); } catch (e) { /* no SMIL */ } }
const riser = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); riser.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
$$('[data-rise-group]').forEach((g) => riser.observe(g));

/* ------------------------------------------------------------------ day trips: tabs and the ticket */
const tablist = $('[data-tabs]');
const tabs = $$('[role="tab"]', tablist);
const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
const ticket = $('[data-ticket]');
const faces = $$('[data-face]', ticket);
let currentTrip = 0;
let frontFace = 0;
let flipTimer = 0;
faces[1].style.visibility = 'hidden';
let ticketAngle = 0;
panels.forEach((p, i) => { p.hidden = i !== 0; });
const ink = document.createElement('span');
ink.className = 'tabs__ink';
ink.setAttribute('aria-hidden', 'true');
tablist.prepend(ink);
function placeInk(animate = true) {
  const t = tabs[currentTrip];
  if (!animate) ink.style.transition = 'none';
  ink.style.width = `${t.offsetWidth}px`;
  ink.style.transform = `translateX(${t.offsetLeft}px)`;
  if (!animate) { ink.getBoundingClientRect(); ink.style.transition = ''; }
}
function fillFace(face, d) {
  const img = $('[data-face-img]', face);
  img.src = d.img; img.alt = d.alt;
  $('[data-face-name]', face).textContent = d.name;
  $('[data-face-when]', face).textContent = d.when;
  $('[data-face-price]', face).textContent = d.price;
}
// warm the three ticket photos so a flip never shows an empty face
let warmed = false;
function warmTrips() { if (warmed) return; warmed = true; panels.forEach((p) => { const i = new Image(); i.src = p.dataset.img; }); }
function showTrip(i, { focus = false } = {}) {
  if (i === currentTrip) return;
  const dir = i > currentTrip ? 1 : -1;
  tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
  panels[currentTrip].hidden = true;
  const next = panels[i];
  next.hidden = false;
  next.classList.remove('is-entering'); void next.offsetWidth; next.classList.add('is-entering');
  if (focus) tabs[i].focus();
  currentTrip = i;
  placeInk();
  if (reduce) { fillFace(faces[frontFace], next.dataset); return; }
  const back = faces[1 - frontFace];
  const old = faces[frontFace];
  fillFace(back, next.dataset);
  back.style.visibility = 'visible';
  clearTimeout(flipTimer);
  flipTimer = setTimeout(() => { old.style.visibility = 'hidden'; }, 1080);
  ticketAngle += 180 * dir;
  ticket.style.transform = `rotateY(${ticketAngle}deg)`;
  faces[frontFace].setAttribute('aria-hidden', 'true');
  back.removeAttribute('aria-hidden');
  frontFace = 1 - frontFace;
}
tabs.forEach((t, i) => t.addEventListener('click', () => { warmTrips(); showTrip(i); }));
tablist.addEventListener('keydown', (e) => {
  const map = { ArrowRight: 1, ArrowLeft: -1 };
  let i = currentTrip;
  if (e.key in map) i = (currentTrip + map[e.key] + tabs.length) % tabs.length;
  else if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = tabs.length - 1;
  else return;
  e.preventDefault(); warmTrips(); showTrip(i, { focus: true });
});
tablist.addEventListener('pointerenter', warmTrips, { once: true });

// pointer tilt (desktop): the ticket follows the hand, with a spring-like lag
const tiltEl = $('[data-ticket-tilt]');
const stage = $('[data-ticket-stage]');
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
if (finePointer && !reduce) {
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    tilt.tx = clamp(nx, -1, 1) * 11;
    tilt.ty = clamp(ny, -1, 1) * -9;
    wake();
  });
  stage.addEventListener('pointerleave', () => { tilt.tx = 0; tilt.ty = 0; wake(); });
}

/* ------------------------------------------------------------------ private charters: 3D word and the deck */
if (giantStack && !reduce) {
  const front = giantStack.firstElementChild;
  for (let i = 1; i <= 14; i++) {
    const l = front.cloneNode(true);
    l.dataset.depth = i;
    giantStack.append(l);
  }
}
function depthGiant() {
  if (!giantStack) return;
  const fs = parseFloat(getComputedStyle(giantStack.firstElementChild).fontSize) || 100;
  const step = fs * 0.016;
  $$('[data-depth]', giantStack).forEach((l) => { l.style.transform = `translateZ(${-l.dataset.depth * step}px)`; });
}

const deck = $('[data-deck]');
const deckCards = $$('[data-deck-card]', deck);
let deckInner = null;
let activeCard = 0;
if (deck) {
  deckInner = document.createElement('div');
  deckInner.className = 'deck__inner';
  deckInner.style.cssText = 'position:absolute;inset:0;transform-style:preserve-3d;';
  deckCards.forEach((c) => deckInner.append(c));
  deck.append(deckInner);
}
function layoutDeck() {
  const n = deckCards.length;
  deckCards.forEach((c, i) => {
    const k = (i - activeCard + n) % n;
    c.style.zIndex = String(n - k);
    c.style.transform = reduce ? (k ? 'translateY(4%) scale(0.96)' : 'none') : `translate3d(${k * 7}%, ${-k * 12}%, ${-k * 150}px) rotateZ(${k ? -k * 2.4 : 0}deg)`;
    c.style.opacity = k > 2 ? '0' : String(1 - k * 0.14);
    c.setAttribute('aria-hidden', String(k !== 0));
  });
}
layoutDeck();
const charters = $$('.charter');
charters.forEach((d) => d.addEventListener('toggle', () => {
  if (!d.open) return;
  charters.forEach((o) => { if (o !== d && o.open) o.open = false; });
  activeCard = Number(d.dataset.card) || 0;
  layoutDeck();
  if (!reduce) {
    const body = $('.charter__body', d);
    body.animate([{ opacity: 0, transform: 'perspective(900px) rotateX(-70deg)' }, { opacity: 1, transform: 'none' }], { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }
}));

/* ------------------------------------------------------------------ reviews: the 3D wall */
const wall = $('[data-wall]');
if (wall && !reduce) {
  $$('[data-wall-row]', wall).forEach((row) => {
    [...row.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); row.append(k); });
    row.style.setProperty('--dur', `${Math.round(row.scrollWidth / 2 / 34)}s`);
    row.classList.add('is-moving');
  });
  new IntersectionObserver(([e]) => wall.classList.toggle('is-paused', !e.isIntersecting)).observe(wall);
  const inWall = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.style.visibility = e.isIntersecting ? '' : 'hidden';
  }, { root: wall, threshold: 0 });
  $$('.review', wall).forEach((r) => inWall.observe(r));
}

/* ------------------------------------------------------------------ the dive */
const dive = $('[data-dive]');
const shots = dive ? $$('.dive__shot', dive) : [];
const diveWorld = $('[data-dive-world]');
const diveIntro = $('[data-dive-intro]');
const diveEnd = $('[data-dive-end]');
if (dive && !reduce) dive.classList.add('is-3d');
const SPACING = 620;
const FLATS = [63, 208, 200];
const ABYSS = [6, 32, 51];

/* ------------------------------------------------------------------ contact: split-flap email */
if (email) {
  const text = email.textContent.trim();
  email.setAttribute('aria-label', `Email ${text}`);
  email.textContent = '';
  const chars = [];
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
    email.append(s); chars.push(s);
    if (ch === '@') email.append(document.createElement('wbr'));
  }
  let flapping = false;
  if (finePointer && !reduce) {
    email.addEventListener('pointerenter', () => {
      if (flapping) return;
      flapping = true;
      const anims = chars.map((c, i) => c.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-360deg)' }], { duration: 760, delay: i * 24, easing: 'cubic-bezier(0.76, 0, 0.24, 1)' }));
      anims[anims.length - 1].finished.then(() => { flapping = false; }).catch(() => { flapping = false; });
    });
  }
}

/* ------------------------------------------------------------------ geometry cache */
const hero = $('[data-hero]');
const heroFrame = $('[data-hero-frame]');
const heroPic = $('[data-parallax]');
const ticker = $('[data-ticker]');
const trips = $('[data-trips]');
const privateSec = $('[data-private]');
const mainEl = $('main');
const footer = $('[data-footer]');
const footerLetters = footerWord ? $$('span', footerWord) : [];
const geo = {};
function measure() {
  const y = scrollY;
  const box = (el) => { if (!el) return { top: 0, h: 0 }; const r = el.getBoundingClientRect(); return { top: r.top + y, h: r.height }; };
  geo.vh = innerHeight;
  geo.trips = box(trips);
  geo.private = box(privateSec);
  geo.dive = box(dive);
  geo.mainBottom = box(mainEl).top + box(mainEl).h;
}

/* ------------------------------------------------------------------ the frame loop */
let ticking = false;
function wake() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
addEventListener('scroll', wake, { passive: true });

function frame() {
  ticking = false;
  const y = scrollY;
  const vh = geo.vh || innerHeight;

  // hero: the postcard tilts back as the trips slide over it; DEL and FIN drift apart
  const p = clamp(y / vh);
  if (!reduce && heroFrame) {
    heroFrame.style.transform = p > 0 ? `translate3d(0, ${p * 2}vh, 0) rotateX(${-p * 16}deg) scale(${1 - p * 0.06})` : '';
    if (heroPic) heroPic.style.transform = p > 0 ? `scale(${1 + p * 0.1})` : '';
  }
  ticker?.classList.toggle('is-paused', p >= 1);
  if (hero) hero.style.visibility = y > vh * 1.05 ? 'hidden' : '';
  nav?.classList.toggle('is-floating', y > vh * 0.6);

  // the ticket is dealt onto the table as the trips arrive, then follows the pointer
  if (tiltEl && geo.trips) {
    const q = reduce ? 1 : smooth(0, 0.42, (y + vh - geo.trips.top) / (vh + geo.trips.h));
    tilt.x = lerp(tilt.x, tilt.tx, 0.12);
    tilt.y = lerp(tilt.y, tilt.ty, 0.12);
    if (!reduce) tiltEl.style.transform = `translate3d(0, ${(1 - q) * 90}px, ${(1 - q) * -160}px) rotateX(${(1 - q) * 42 + tilt.y}deg) rotateY(${tilt.x}deg) rotateZ(${(1 - q) * -6}deg)`;
    if (Math.abs(tilt.x - tilt.tx) > 0.05 || Math.abs(tilt.y - tilt.ty) > 0.05) wake();
  }

  // private: the word turns like a sign, the deck leans as you pass
  if (!reduce && geo.private && privateSec) {
    const q = clamp((y + vh - geo.private.top) / (vh + geo.private.h));
    if (q > 0 && q < 1) {
      if (giantStack) giantStack.style.transform = `rotateX(${lerp(16, -8, q)}deg) rotateY(${lerp(-26, 20, q)}deg)`;
      if (deckInner) deckInner.style.transform = `rotateX(${lerp(10, -6, q)}deg) rotateY(${lerp(-14, 10, q)}deg)`;
    }
  }

  // the dive: fly through the day, from the flats into deep water
  if (dive && dive.classList.contains('is-3d') && geo.dive) {
    const range = Math.max(1, geo.dive.h - vh);
    const d = clamp((y - geo.dive.top) / range);
    const inView = y + vh > geo.dive.top && y < geo.dive.top + geo.dive.h;
    if (inView) {
      const last = shots.length - 1;
      const T = lerp(-1500, last * SPACING + 2300, d);
      diveWorld.style.transform = `translate3d(0, 0, ${T}px)`;
      const show = smooth(0.07, 0.13, d);
      shots.forEach((s, i) => {
        const z = -i * SPACING + T;
        const o = show * smooth(-3600, -2300, z) * (1 - smooth(240, 520, z));
        s.style.opacity = o.toFixed(3);
        s.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      const c = smooth(0.05, 0.85, d);
      dive.style.backgroundColor = `rgb(${FLATS.map((v, i) => Math.round(lerp(v, ABYSS[i], c))).join(',')})`;
      dive.style.color = c > 0.4 ? '#fff' : '';
      if (diveIntro) { const f = smooth(0.004, 0.045, d); diveIntro.style.opacity = String(1 - f); diveIntro.style.visibility = f >= 1 ? 'hidden' : ''; diveIntro.style.transform = `scale(${1 + f * 0.25})`; }
      if (diveEnd) { const e = smooth(0.95, 0.995, d); diveEnd.style.opacity = String(e); diveEnd.style.visibility = e <= 0 ? 'hidden' : ''; diveEnd.classList.toggle('is-on', e > 0.5); }
    }
  }

  // footer: the name stands up as the curtain lifts
  if (footerLetters.length && geo.mainBottom) {
    const r = clamp((vh - (geo.mainBottom - y)) / vh);
    if (footer) footer.style.visibility = geo.mainBottom - y > vh + 40 ? 'hidden' : '';
    footerLetters.forEach((s, i) => {
      if (reduce) { s.style.transform = ''; return; }
      const t = smooth(0, 1, r * 1.5 - i * 0.07);
      s.style.transform = t >= 1 ? '' : `translate3d(0, ${(1 - t) * 34}%, 0) rotateX(${(1 - t) * -88}deg)`;
      s.style.opacity = String(Math.max(t, 0.02));
    });
  }
}

/* ------------------------------------------------------------------ route chart (lazy, WebGL) */
const routeSection = $('[data-route-section]');
const picker = $('[data-picker]');
const radios = picker ? $$('[role="radio"]', picker) : [];
const stopsList = $('[data-stops]');
const distanceEl = $('[data-distance]');
const routeBook = $('[data-route-book]');
const replayBtn = $('[data-replay]');
let chart = null;
let currentRoute = 'rose';
function renderStops(id) {
  const r = ROUTES[id];
  stopsList.innerHTML = '';
  r.stops.forEach((s) => {
    const li = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = s.name;
    const desc = document.createElement('span');
    desc.textContent = s.approx ? `${s.desc} (approximate spot)` : s.desc;
    li.append(name, desc);
    if (s.time) { const t = document.createElement('em'); t.textContent = s.time; li.append(t); }
    stopsList.append(li);
  });
  distanceEl.textContent = r.distance;
  routeBook.href = r.book;
  routeBook.firstChild.textContent = r.bookLabel;
}
function selectRoute(id, { focus = false, scroll = false } = {}) {
  if (!ROUTES[id]) return;
  currentRoute = id;
  radios.forEach((b) => { const on = b.dataset.route === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  renderStops(id);
  if (replayBtn) replayBtn.hidden = true;
  chart?.setRoute(id);
  if (scroll) routeSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
radios.forEach((b) => b.addEventListener('click', () => selectRoute(b.dataset.route)));
picker?.addEventListener('keydown', (e) => {
  const i = radios.findIndex((b) => b.dataset.route === currentRoute);
  const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  if (!(e.key in map)) return;
  e.preventDefault();
  selectRoute(radios[(i + map[e.key] + radios.length) % radios.length].dataset.route, { focus: true });
});
$$('[data-show-route]').forEach((a) => a.addEventListener('click', () => selectRoute(a.dataset.showRoute)));
replayBtn?.addEventListener('click', () => { replayBtn.hidden = true; chart?.replay(); });
function onStop(i) {
  $$('li', stopsList).forEach((li, k) => { li.classList.toggle('is-now', k === i); li.classList.toggle('is-done', k < i); });
}
function onDone() { if (replayBtn) replayBtn.hidden = false; }

const chartBox = $('[data-chart]');
let chartRequested = false;
let routeVisible = false;
function loadChart() {
  if (chartRequested || !chartBox) return;
  chartRequested = true;
  const load = (src) => new Promise((ok, fail) => { const t = document.createElement('script'); t.src = src; t.async = true; t.onload = ok; t.onerror = fail; document.head.append(t); });
  Promise.all([load('js/chart-data.js'), load('js/chart3d.js')])
    .then(() => window.DelfinChart.createChart({ container: chartBox, labels: $('[data-chart-labels]'), data: window.DELFIN_CHART_DATA, routes: ROUTES, reduceMotion: reduce, onStop, onDone }))
    .then((c) => {
      if (!c) return;
      chart = c;
      chartBox.classList.add('is-live');
      chart.setVisible(routeVisible);
      chart.setRoute(currentRoute);
    })
    .catch(() => { /* the still image and the stop list stay */ });
}
if (routeSection) {
  new IntersectionObserver(([e]) => { if (e.isIntersecting) loadChart(); }, { rootMargin: '900px 0px' }).observe(routeSection);
  new IntersectionObserver(([e]) => { routeVisible = e.isIntersecting; chart?.setVisible(routeVisible); }).observe(routeSection);
}

/* ------------------------------------------------------------------ boot */
function layout() { fitAll(); depthGiant(); placeInk(false); measure(); wake(); }
layout();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureCap(); layout(); });
addEventListener('load', layout);
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });
if (phone.addEventListener) phone.addEventListener('change', layout);
})();
