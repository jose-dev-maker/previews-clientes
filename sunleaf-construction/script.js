/* Sunleaf Construction preview: the 7-to-7 clock, the quote message, the row, the chapter bar. */
(() => {
  'use strict';
  const PHONE = '12845437397';
  const OPEN = 7 * 60;   // 7am
  const CLOSE = 19 * 60; // 7pm
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- the 7-to-7 clock (Tortola is on Atlantic Standard Time, UTC-4, all year) ---------- */
  const tortola = () => {
    const d = new Date(Date.now() - 4 * 3600 * 1000);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  };
  const clock = (t) => {
    const h = Math.floor(t / 60), m = t % 60;
    return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`; // taste-skill-ignore: minutes of a clock
  };
  const span = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return `${h} h ${m} min`;
    return h ? `${h} h` : `${m} min`;
  };

  const heroNow = $('[data-now]');
  const cardNow = $('[data-now-card]');
  const visitNow = $('[data-clock]');
  const sun = $('.sun');
  const sunDot = $('[data-sun-dot]');

  function tick() {
    const t = tortola();
    const on = t >= OPEN && t < CLOSE;
    const state = on ? 'on' : 'off';
    const day = Math.min(1, Math.max(0, (t - OPEN) / (CLOSE - OPEN)));
    if (heroNow) {
      heroNow.dataset.state = state;
      heroNow.textContent = on
        ? `It's ${clock(t)} in Tortola. We're open until 7pm.`
        : t < OPEN ? `It's ${clock(t)} in Tortola. We start at 7am.` : `It's ${clock(t)} in Tortola. We're back at 7am.`;
    }
    if (cardNow) {
      cardNow.textContent = on
        ? `We're open now: ${span(CLOSE - t)} left of today's 7 to 7.`
        : t < OPEN ? `We start at 7am. Send it now and we'll see it first thing.` : `We're off until 7am. Send it now and we'll see it first thing.`;
    }
    if (visitNow) visitNow.textContent = `${clock(t)}, ${on ? 'open' : 'closed until 7am'}`;
    if (sun) {
      sun.dataset.state = state;
      sun.style.setProperty('--day', sun.classList.contains('is-in') || reduce ? day.toFixed(4) : 0);
      sun.dataset.day = day.toFixed(4);
    }
  }
  const sizeSun = () => { if (sun) sun.style.setProperty('--sun-w', `${sun.clientWidth}px`); };
  sizeSun();
  tick();
  setInterval(tick, 30000);
  window.addEventListener('resize', sizeSun, { passive: true });

  /* ---------- reveals, once ---------- */
  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      if (e.target === sun) sun.style.setProperty('--day', sun.dataset.day || 0);
      reveal.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('[data-reveal], .shutter, .process__row, .notice, .reel__frame, .card, .sun').forEach((el) => reveal.observe(el));
  $$('.moment').forEach((m, i) => m.style.setProperty('--n', i));

  /* ---------- the fixed bar takes the colours of the chapter beneath it ---------- */
  const bar = $('[data-bar]');
  const hero = $('.hero');
  const dock = $('[data-dock]');
  const card = $('.card');
  let pastHero = false, atCard = false;
  const syncDock = () => { if (dock) dock.classList.toggle('is-on', pastHero && !atCard); };

  if (bar && hero) {
    new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting;
      bar.classList.toggle('is-on', pastHero);
      syncDock();
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(hero);

    const links = $$('[data-spy]', bar);
    const chapters = $$('main > section, footer');
    const under = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cs = getComputedStyle(e.target);
        const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : cs.backgroundColor;
        bar.style.setProperty('--bar-bg', bg);
        bar.style.setProperty('--bar-ink', cs.color);
        links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.spy === e.target.id)));
      }
    }, { rootMargin: '0px 0px -94% 0px' });
    chapters.forEach((c) => under.observe(c));
  }
  if (card) {
    new IntersectionObserver(([e]) => { atCard = e.isIntersecting; syncDock(); }, { threshold: 0.15 }).observe(card);
  }

  /* ---------- how we build: the drag row ---------- */
  const row = $('[data-row]');
  if (row) {
    const thumb = $('[data-row-thumb]');
    const prev = $('[data-row-prev]');
    const next = $('[data-row-next]');
    const step = () => {
      const first = row.querySelector('.moment');
      return first ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || 32) : 320;
    };
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = row.scrollWidth - row.clientWidth;
      const frac = Math.min(1, row.clientWidth / row.scrollWidth);
      const p = max > 0 ? row.scrollLeft / max : 0;
      if (thumb) {
        const track = thumb.parentElement.clientWidth;
        thumb.style.width = `${frac * 100}%`;
        thumb.style.transform = `translateX(${p * (1 - frac) * track}px)`;
      }
      if (prev) prev.disabled = row.scrollLeft <= 2;
      if (next) next.disabled = row.scrollLeft >= max - 2;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
    row.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    paint();
    const go = (dir) => row.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // Mouse drag; touch keeps its own native scrolling.
    let down = false, startX = 0, startLeft = 0;
    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; startX = e.clientX; startLeft = row.scrollLeft;
      row.setPointerCapture(e.pointerId);
    });
    row.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) row.classList.add('is-dragging');
      row.scrollLeft = startLeft - dx;
    });
    const release = () => {
      if (!down) return;
      down = false;
      const left = row.scrollLeft;
      row.classList.remove('is-dragging');
      // let the snap land on the nearest moment, from where the hand let go
      row.scrollLeft = left;
    };
    row.addEventListener('pointerup', release);
    row.addEventListener('pointercancel', release);
  }

  /* ---------- the quote: the page writes the WhatsApp message ---------- */
  const form = $('[data-quote]');
  if (form) {
    const send = $('[data-wa-send]', form);
    const preview = $('[data-wa-preview]', form);
    const subject = {
      'A new home': 'a new home',
      'An office or commercial building': 'an office or commercial building',
      'Something else': 'a building project',
    };
    const value = (name) => (form.elements[name] && form.elements[name].value || '').trim();

    const compose = () => {
      const what = subject[value('what')] || 'a building project';
      const where = value('where');
      const stage = value('stage');
      const when = value('when');
      const note = value('note');
      const name = value('name');
      let msg = `Hi Sunleaf! I'd like a quote for ${what}${where ? ` in ${where}` : ''}.`;
      if (stage) msg += ` ${stage}.`;
      if (when) msg += when === "I'm not sure yet" ? " I'm not sure yet when to start." : ` I'd like to start ${when}.`;
      if (note) msg += `\n\n${note}`;
      msg += name ? `\n\nThanks, ${name}` : '\n\nThanks!';
      return msg;
    };
    const update = () => {
      const msg = compose();
      if (send) send.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
      if (preview) preview.textContent = msg;
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', (e) => { e.preventDefault(); if (send) window.open(send.href, '_blank', 'noopener'); });
    update();

    // "Quote a home" / "Quote an office" choose the answer before the page moves to the card
    const pick = { home: 'A new home', office: 'An office or commercial building' };
    $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
      const v = pick[a.dataset.pick];
      const input = $$('input[name="what"]', form).find((i) => i.value === v);
      if (input) { input.checked = true; update(); }
    }));
  }
})();
