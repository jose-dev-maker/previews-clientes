/* JSM Island Charters & Water Taxi — design preview */
(() => {
  'use strict';

  const PHONE = '12845446544';
  const EMAIL = 'jsmislandcharters@gmail.com';
  const ROAD_TOWN = { lat: 18.4207, lon: -64.6203, utcOffset: -4 }; // AST, no daylight saving
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- sunset in Road Town (NOAA approximation, no network needed) ---------- */
  function sunsetLocalHours(y, m, d) {
    const rad = Math.PI / 180;
    const { lat, lon, utcOffset } = ROAD_TOWN;
    const N1 = Math.floor(275 * m / 9);
    const N2 = Math.floor((m + 9) / 12);
    const N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
    const N = N1 - N2 * N3 + d - 30;
    const lngHour = lon / 15;
    const t = N + (18 - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
    RA = ((RA % 360) + 360) % 360;
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
    const H = Math.acos(cosH) / rad / 15;
    const T = H + RA - 0.06571 * t - 6.622;
    const ut = (((T - lngHour) % 24) + 24) % 24;
    return (((ut + utcOffset) % 24) + 24) % 24;
  }
  function formatClock(hours) {
    let h = Math.floor(hours);
    let min = Math.round((hours - h) * 60);
    if (min === 60) { h += 1; min = 0; }
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(min).padStart(2, '0')} ${suffix}`; // taste-skill-ignore: clock minutes
  }
  function roadTownToday() {
    const now = new Date(Date.now() + ROAD_TOWN.utcOffset * 3600 * 1000);
    return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };
  }
  const today = roadTownToday();
  const sunsetTime = $('[data-sunset-time]');
  if (sunsetTime) sunsetTime.textContent = formatClock(sunsetLocalHours(today.y, today.m, today.d));

  /* ---------- hero: slow crossfade on the fixed panel, with the Ladii Annie film as one of the slides ---------- */
  const show = $('[data-slideshow]');
  if (show) {
    // wide screens: the drone photograph of Ladii Annie, then lll Reasons from the air;
    // phones: Ladii Annie on the sand, then the Ladii Annie film (both films are portrait-safe at those sizes)
    const wideMQ = window.matchMedia('(min-width: 900px)');
    const toggle = $('[data-slideshow-toggle]');
    let slides = [], film = null, filmStart = 0, filmEnd = 0, filmOk = false;
    let index = 0, timer = null, userPaused = false, visible = true, busy = false;
    const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
    const canRun = () => !reduceMotion.matches && !userPaused && visible && !document.hidden;
    function setup() {
      clearTimeout(timer); timer = null; busy = false;
      if (film) film.pause();
      $$('.hero__slide', show).forEach((s) => s.classList.remove('is-on'));
      const set = wideMQ.matches ? 'wide' : 'tall';
      slides = $$('.hero__slide', show).filter((s) => (s.dataset.set || '').split(' ').includes(set));
      film = slides.find((s) => s.tagName === 'VIDEO') || null;
      filmStart = film ? parseFloat(film.dataset.start || '0') : 0;
      filmEnd = film ? parseFloat(film.dataset.end || '0') : 0;
      filmOk = !!film && !reduceMotion.matches;
      index = 0;
      if (slides[0]) slides[0].classList.add('is-on');
      if (filmOk) { const f = film; pageLoaded.then(() => { if (f === film) { f.preload = 'auto'; f.load(); } }); }
      schedule();
    }
    const nextIndex = (i) => {
      let n = (i + 1) % slides.length;
      if (slides[n] === film && !(filmOk && film.readyState >= 3)) n = (n + 1) % slides.length; // still loading: next round
      return n;
    };
    const swap = (n) => {
      const prev = slides[index];
      slides[n].classList.add('is-on');
      prev.classList.remove('is-on');
      index = n;
      if (prev === film) setTimeout(() => { if (slides[index] !== film) film.pause(); }, 1700);
      busy = false;
      schedule();
    };
    const go = () => {
      if (busy) return;
      busy = true;
      const n = nextIndex(index);
      if (slides[n] === film) {
        try { film.currentTime = filmStart; } catch (e) { /* not seekable yet */ }
        const p = film.play();
        if (p && p.then) p.then(() => swap(n)).catch(() => { filmOk = false; busy = false; schedule(); });
        else swap(n);
      } else {
        swap(n);
      }
    };
    function schedule() {
      clearTimeout(timer); timer = null;
      if (!canRun() || slides.length < 2) return;
      if (slides[index] === film) return; // the film moves on by itself when it reaches its end point
      timer = setTimeout(go, index === 0 ? 5000 : 5600);
    }
    $$('video.hero__slide', show).forEach((v) => {
      v.addEventListener('timeupdate', () => {
        if (v === film && slides[index] === v && filmEnd && v.currentTime >= filmEnd - 1.4) go();
      });
      v.addEventListener('ended', () => { if (v === film && slides[index] === v) go(); });
    });
    const sync = () => {
      if (film && slides[index] === film) {
        if (canRun()) film.play().catch(() => {}); else film.pause();
      }
      schedule();
    };
    if (reduceMotion.matches && toggle) toggle.hidden = true;
    toggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.textContent = userPaused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', userPaused ? 'Play the photos and film' : 'Pause the photos and film');
      sync();
    });
    document.addEventListener('visibilitychange', sync);
    reduceMotion.addEventListener?.('change', sync);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(show);
    wideMQ.addEventListener?.('change', setup);
    setup();
  }

  /* ---------- the planner ---------- */
  const planner = $('[data-planner]');
  if (planner) {
    const tabs = $$('[data-boat-tab]', planner);
    const panel = $('#boat-panel', planner);
    const form = $('[data-plan-form]', planner);
    const dateInput = $('[data-plan-date]', planner);
    const guestsInput = $('[data-plan-guests]', planner);
    const routeInput = $('[data-plan-route]', planner);
    const routeField = $('[data-route]', planner);
    const ideasField = $('[data-ideas]', planner);
    const ideas = $$('.idea', planner);
    const sunsetHint = $('[data-sunset-for-date]', planner);
    const wa = $('[data-plan-wa]', planner);
    const mail = $('[data-plan-mail]', planner);
    const chart = $('[data-chart]', planner);
    const priceWhat = $('[data-price-what]', planner);
    const priceFrom = $('[data-price-from]', planner);
    const priceAmount = $('[data-price-amount]', planner);
    const PRICES = { ladii: { half: '$1,650', full: '$2,050' }, reasons: { half: '$850', full: '$1,450' } };
    const TRIP_NAMES = { half: 'Half day', full: 'Full day', taxi: 'Water taxi' };
    // each route is drawn by animating its dash: measure it once
    if (chart) $$('.chart__route', chart).forEach((r) => { try { r.style.setProperty('--len', Math.ceil(r.getTotalLength())); } catch (e) { /* old browsers keep the default */ } });

    const boats = {
      ladii: { name: 'Ladii Annie', model: '39ft Midnight Express' },
      reasons: { name: 'lll Reasons', model: '30ft Scarab' },
    };
    const pad = (n) => String(n).padStart(2, '0'); // taste-skill-ignore: ISO date for the date field
    if (dateInput) dateInput.min = `${today.y}-${pad(today.m)}-${pad(today.d)}`;

    const parseDate = (value) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
    };
    const longDate = ({ y, m, d }) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));

    function compose() {
      const boat = boats[planner.dataset.boat] || boats.ladii;
      const trip = (form.querySelector('input[name="trip"]:checked') || {}).value || 'half';
      const date = parseDate(dateInput.value);
      const guests = parseInt(guestsInput.value, 10);
      const chosen = ideas.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent.trim());
      const route = routeInput.value.trim();
      const when = date ? ` on ${longDate(date)}` : '';
      const who = guests > 0 ? ` for ${guests} ${guests === 1 ? 'guest' : 'guests'}` : '';
      let text, subject;
      if (trip === 'taxi') {
        text = `Hi JSM Island Charters! I'd like a water taxi on ${boat.name} (${boat.model})${route ? `, ${route}` : ''}${when}${who}. Could you send me a price?`;
        subject = `Water taxi request${date ? ` for ${longDate(date)}` : ''}`;
      } else {
        const length = trip === 'full' ? 'a full-day charter (8 hours)' : 'a half-day charter (4 hours)';
        text = `Hi JSM Island Charters! I'd like to book ${boat.name} (${boat.model}) for ${length}${when}${who}.${chosen.length ? ` We'd love: ${chosen.join(', ')}.` : ''} Is it available?`;
        subject = `${boat.name} ${trip === 'full' ? 'full-day' : 'half-day'} charter${date ? `, ${longDate(date)}` : ''}`;
      }
      wa.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
      mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

      // the price of what is chosen, large next to the button
      const key = planner.dataset.boat === 'reasons' ? 'reasons' : 'ladii';
      if (priceWhat) priceWhat.textContent = `${TRIP_NAMES[trip] || 'Half day'} on ${boat.name}`;
      if (priceAmount) priceAmount.textContent = trip === 'taxi' ? 'On request' : PRICES[key][trip];
      if (priceFrom) priceFrom.hidden = trip === 'taxi';

      // the chart: the water taxi shows the way to St Thomas; a charter shows the places picked
      if (chart) {
        const places = trip === 'taxi' ? ['stt'] : ideas.filter((b) => b.getAttribute('aria-pressed') === 'true' && b.dataset.place).map((b) => b.dataset.place);
        chart.dataset.show = places.join(' ');
        const capCharter = $('[data-cap-charter]', chart), capTaxi = $('[data-cap-taxi]', chart);
        if (capCharter) capCharter.hidden = trip === 'taxi';
        if (capTaxi) capTaxi.hidden = trip !== 'taxi';
      }
    }

    function selectBoat(key, focus) {
      planner.dataset.boat = key;
      tabs.forEach((t) => {
        const on = t.dataset.boatTab === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) {
          panel.setAttribute('aria-labelledby', t.id);
          if (focus) t.focus();
        }
      });
      compose();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectBoat(t.dataset.boatTab));
      t.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = null;
        if (e.key in keys) next = (i + keys[e.key] + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); selectBoat(tabs[next].dataset.boatTab, true); }
      });
    });

    function syncTrip() {
      const trip = (form.querySelector('input[name="trip"]:checked') || {}).value;
      const taxi = trip === 'taxi';
      routeField.hidden = !taxi;
      ideasField.hidden = taxi;
      compose();
    }
    form.addEventListener('change', (e) => { if (e.target.name === 'trip') syncTrip(); else compose(); });
    form.addEventListener('input', compose);
    form.addEventListener('submit', (e) => e.preventDefault());
    ideas.forEach((b) => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      compose();
    }));
    dateInput.addEventListener('change', () => {
      const date = parseDate(dateInput.value);
      sunsetHint.textContent = date
        ? `Sunset that evening in Road Town: ${formatClock(sunsetLocalHours(date.y, date.m, date.d))}`
        : 'Pick a date to see that evening’s sunset';
    });

    syncTrip();
  }

  /* ---------- prefilled WhatsApp links elsewhere ---------- */
  const generic = `https://wa.me/${PHONE}?text=${encodeURIComponent("Hi JSM Island Charters! I found you on your website and I'd like to ask about a trip.")}`;
  $$('[data-wa-generic]').forEach((a) => { a.href = generic; });
  $$('[data-wa-taxi]').forEach((a) => {
    a.href = `https://wa.me/${PHONE}?text=${encodeURIComponent("Hi JSM Island Charters! I'd like a water taxi. From: ... To: ... Date: ... Guests: ...")}`;
  });

  /* ---------- reveals, once, staggered inside each section ---------- */
  const groups = new Map();
  $$('[data-reveal], [data-slip], [data-mod]').forEach((el) => {
    const host = el.closest('.slips, .row, section, .stage, .sheet') || document.body;
    const list = groups.get(host) || [];
    const step = el.hasAttribute('data-slip') ? 70 : 85;
    el.style.setProperty('--d', `${Math.min(list.length, 8) * step}ms`);
    list.push(el);
    groups.set(host, list);
  });
  const targets = $$('[data-reveal], [data-reveal-plate], [data-slip], [data-mod], .foot');
  // A clipped element reports no visible area, so the plate is watched through its parent.
  const watchOf = (el) => (el.hasAttribute('data-reveal-plate') ? el.parentElement : el);
  if ('IntersectionObserver' in window) {
    const owners = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (owners.get(e.target) || []).forEach((el) => el.classList.add('is-in'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach((el) => {
      const w = watchOf(el);
      owners.set(w, [...(owners.get(w) || []), el]);
      io.observe(w);
    });
  } else {
    targets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- the photo row: drag with a mouse, swipe with a thumb ---------- */
  const row = $('[data-drag-row]');
  if (row) {
    let startX = 0, startScroll = 0, dragging = false, moved = false;
    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest('button')) return;
      dragging = true; moved = false; startX = e.clientX; startScroll = row.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; row.classList.add('is-dragging'); }
      if (moved) row.scrollLeft = startScroll - dx;
    });
    const end = () => { if (!dragging) return; dragging = false; row.classList.remove('is-dragging'); };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* ---------- films: play only while on screen, never under reduced motion ---------- */
  $$('[data-film]').forEach((video) => {
    const button = video.parentElement.querySelector('[data-film-toggle]');
    let userPaused = reduceMotion.matches, onScreen = false;
    const label = () => {
      if (!button) return;
      const playing = !video.paused;
      button.textContent = playing ? 'Pause film' : 'Play film';
      button.setAttribute('aria-pressed', String(!playing));
    };
    const sync = () => {
      if (onScreen && !userPaused && !document.hidden) {
        const p = video.play(); if (p && p.catch) p.catch(() => {});
      } else {
        video.pause();
      }
    };
    video.addEventListener('play', label);
    video.addEventListener('pause', label);
    // a film can loop on its best stretch (data-start / data-end, in seconds)
    const start = parseFloat(video.dataset.start || '0');
    const stop = parseFloat(video.dataset.end || '0');
    if (start > 0) video.addEventListener('loadedmetadata', () => { if (video.currentTime < start) video.currentTime = start; });
    if (stop > start) video.addEventListener('timeupdate', () => { if (video.currentTime >= stop || video.currentTime < start - 0.5) video.currentTime = start; });
    button?.addEventListener('click', () => { userPaused = !video.paused; if (!userPaused) { onScreen = true; } sync(); if (!userPaused) video.play().catch(() => {}); });
    document.addEventListener('visibilitychange', sync);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(video);
    label();
  });

  /* ---------- top bar (desktop) and action dock (phone) ---------- */
  const topbar = $('[data-topbar]');
  const hero = $('.hero');
  const foot = $('.foot');
  if (topbar && hero) {
    let pastStage = false, footTop = false;
    const sync = () => topbar.classList.toggle('is-shown', pastStage && !footTop);
    new IntersectionObserver(([e]) => {
      pastStage = !e.isIntersecting && e.boundingClientRect.top < 0; sync();
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
    // step aside when the footer's own link row reaches the top of the screen
    if (foot) new IntersectionObserver(([e]) => { footTop = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -85% 0px' }).observe(foot);
  }
  const dock = $('[data-dock]');
  const heroAction = $('[data-hero-action]');
  if (dock && heroAction) {
    // the dock steps aside while the reader scrolls down (so it never sits on a heading they are reading)
    // and comes back as soon as they scroll up, like the browser's own toolbar
    let pastHero = false, atFoot = false, goingDown = false, lastY = window.scrollY, ticking = false;
    const sync = () => dock.classList.toggle('is-shown', pastHero && !atFoot && !goingDown);
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 6) { goingDown = y > lastY; lastY = y; sync(); }
        ticking = false;
      });
    }, { passive: true });
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(heroAction);
    if (foot) new IntersectionObserver(([e]) => { atFoot = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe(foot);
  }

  /* ---------- top bar tabs: mark the section in the middle of the screen ---------- */
  const spyLinks = $$('.topbar__nav a[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        spyLinks.forEach((a) => {
          const on = a.dataset.spy === e.target.id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id], footer[id]').forEach((sec) => spy.observe(sec));
  }

  /* ---------- the name across the footer, fitted to the width ---------- */
  const mark = $('[data-fit]');
  if (mark) {
    const fit = () => {
      const box = mark.parentElement;
      const style = getComputedStyle(box);
      const width = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      mark.style.fontSize = '100px';
      const natural = mark.getBoundingClientRect().width; // the mark is inline-block, so this is the text itself
      if (natural > 0) mark.style.fontSize = `${Math.floor((100 * width / natural) * 0.99)}px`;
    };
    fit();
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fit);
    let raf = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });
  }
})();
