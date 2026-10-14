(() => {
  const root = document.documentElement;
  const body = document.body;
  const S = window.STORIES;
  const img = window.STORY_IMG;
  const byId = Object.fromEntries(S.map((s) => [s.id, s]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Today's date in the header, like the reference */
  document.querySelector('[data-today]').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  /* =========================================================
     HERO DECK
     ========================================================= */
  const deckEl = document.querySelector('[data-deck]');
  const topicsEl = document.querySelector('[data-topics]');
  const featured = S.slice(0, 5);

  deckEl.innerHTML = featured.map((s) => `
    <article class="card is-intro" data-id="${s.id}" style="--tint:${s.tint}" aria-label="${esc(s.title)}">
      <div class="card__img">
        <img src="${img(s.image, 700)}" alt="${esc(s.alt)}" draggable="false" />
        <span class="card__kicker">${esc(s.topic)}</span>
        <span class="card__time">${esc(s.time)}</span>
        <span class="card__drag" aria-hidden="true">drag</span>
      </div>
      <div class="card__foot">
        <div><small>${esc(s.date)}</small><h3>${esc(s.title)}</h3></div>
        <button class="card__open" data-open="${s.id}" aria-label="Open story: ${esc(s.title)}"><i class="ph-light ph-arrow-right"></i></button>
      </div>
    </article>`).join('') + `
    <div class="deck__ctrl">
      <button class="dot-btn dot-btn--line" data-deck-prev aria-label="Previous story"><i class="ph-light ph-arrow-left"></i></button>
      <button class="dot-btn" data-deck-next aria-label="Next story"><i class="ph-light ph-arrow-right"></i></button>
    </div>`;

  topicsEl.innerHTML = featured.map((s, i) => `<li><button data-topic="${i}">${esc(s.topic)}</button></li>`).join('');

  const cards = [...deckEl.querySelectorAll('.card')];
  const topicBtns = [...topicsEl.querySelectorAll('button')];
  let order = cards.map((_, i) => i); // order[0] is on top

  // Fan positions for depth 0..4
  const FAN = [
    { x: 0, y: 0, r: -4, s: 1 },
    { x: 34, y: -14, r: 8, s: 0.97 },
    { x: -40, y: 10, r: -13, s: 0.94 },
    { x: 46, y: 18, r: 15, s: 0.91 },
    { x: -30, y: -20, r: -19, s: 0.88 },
  ];

  const layout = () => {
    order.forEach((ci, depth) => {
      const c = cards[ci];
      const f = FAN[depth];
      c.style.setProperty('--x', `${f.x}px`);
      c.style.setProperty('--y', `${f.y}px`);
      c.style.setProperty('--r', `${f.r}deg`);
      c.style.setProperty('--s', f.s);
      c.style.zIndex = String(10 - depth);
      c.classList.toggle('is-top', depth === 0);
      c.tabIndex = depth === 0 ? 0 : -1;
      c.setAttribute('aria-hidden', String(depth !== 0));
    });
    const top = order[0];
    topicBtns.forEach((b, i) => {
      b.classList.toggle('is-active', i === top);
      b.setAttribute('aria-pressed', String(i === top));
    });
  };

  const bringToTop = (ci) => {
    if (order[0] === ci) return;
    order = [ci, ...order.filter((x) => x !== ci)];
    layout();
  };
  const next = () => { order.push(order.shift()); layout(); };
  const prev = () => { order.unshift(order.pop()); layout(); };

  topicBtns.forEach((b, i) => b.addEventListener('click', () => bringToTop(i)));
  deckEl.querySelector('[data-deck-next]').addEventListener('click', next);
  deckEl.querySelector('[data-deck-prev]').addEventListener('click', prev);

  // Drag and fling the top card
  let drag = null;
  deckEl.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.card');
    if (!card || !card.classList.contains('is-top') || e.target.closest('.card__open')) return;
    const f = FAN[0];
    drag = { card, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t: performance.now(), vx: 0, lastX: e.clientX, lastT: performance.now(), base: f, moved: false };
    card.setPointerCapture(e.pointerId);
    card.classList.add('is-dragging');
  });
  deckEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const now = performance.now();
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    drag.vx = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
    drag.lastX = e.clientX; drag.lastT = now;
    if (Math.abs(drag.dx) + Math.abs(drag.dy) > 6) drag.moved = true;
    const c = drag.card;
    c.style.setProperty('--x', `${drag.base.x + drag.dx}px`);
    c.style.setProperty('--y', `${drag.base.y + drag.dy * 0.6}px`);
    c.style.setProperty('--r', `${drag.base.r + drag.dx * 0.06}deg`);
  });
  const endDrag = () => {
    if (!drag) return;
    const { card, dx, vx, moved } = drag;
    card.classList.remove('is-dragging');
    drag = null;
    if (!moved) { openStory(card.dataset.id, { from: card }); return; }
    if (Math.abs(dx) > 110 || Math.abs(vx) > 0.6) {
      const dir = Math.sign(dx || vx) || 1;
      card.classList.add('is-flying');
      card.style.setProperty('--x', `${dir * 640}px`);
      card.style.setProperty('--r', `${dir * 34}deg`);
      setTimeout(() => {
        card.classList.remove('is-flying');
        next();
      }, reduced ? 0 : 260);
    } else {
      layout(); // spring back
    }
  };
  deckEl.addEventListener('pointerup', endDrag);
  deckEl.addEventListener('pointercancel', endDrag);

  deckEl.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('card')) return;
    if (e.key === 'ArrowRight') { next(); cards[order[0]].focus(); }
    if (e.key === 'ArrowLeft') { prev(); cards[order[0]].focus(); }
    if (e.key === 'Enter') openStory(e.target.dataset.id, { from: e.target });
  });

  // Entrance: the headline rises, cards fly in and fan out
  const start = () => {
    root.classList.add('is-ready');
    cards.forEach((c, i) => {
      setTimeout(() => {
        c.classList.remove('is-intro');
        if (i === cards.length - 1) layout();
      }, reduced ? 0 : 250 + (cards.length - 1 - i) * 90);
    });
    layout();
  };
  requestAnimationFrame(() => requestAnimationFrame(start));

  /* =========================================================
     TICKER + FOOTER WORDS
     ========================================================= */
  const track = document.querySelector('[data-ticker]');
  track.innerHTML += track.innerHTML; // two copies for a seamless loop

  const words = ['Heartwood', 'Grain', 'Ritual', 'Provenance', 'Craft', 'Record', 'Edition', 'Material', 'Gifting', 'Eastern Ghats', 'Numbered', 'Since 1980'];
  document.querySelector('[data-words]').textContent = Array.from({ length: 480 }, (_, i) => words[(i * 7) % words.length]).join(' ');

  /* =========================================================
     ARCHIVE LIST + FILTERS
     ========================================================= */
  const rowsEl = document.querySelector('[data-rows]');
  rowsEl.innerHTML = S.map((s) => `
    <li class="row" data-topic="${esc(s.topic)}" style="--tint:${s.tint}">
      <a href="#story-${s.id}" data-open="${s.id}">
        <span class="row__thumb"><img src="${img(s.image, 300)}" alt="" loading="lazy" /></span>
        <span>
          <span class="row__meta"><b>${esc(s.topic)}</b>${esc(s.date)}, ${esc(s.time)}</span>
          <h3>${esc(s.title)}</h3>
        </span>
        <span class="row__go" aria-hidden="true"><i class="ph-light ph-arrow-up-right"></i></span>
      </a>
    </li>`).join('');

  const topics = ['All', ...new Set(S.map((s) => s.topic))];
  const filtersEl = document.querySelector('[data-filters]');
  filtersEl.innerHTML = topics.map((t, i) => `<button aria-pressed="${i === 0}" data-filter="${esc(t)}">${esc(t)}</button>`).join('');
  filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filtersEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.filter;
    let n = 0;
    rowsEl.querySelectorAll('.row').forEach((r) => {
      const show = f === 'All' || r.dataset.topic === f;
      r.classList.toggle('is-hidden', !show);
      if (show) {
        r.classList.add('is-entering');
        const d = n++ * 60;
        setTimeout(() => requestAnimationFrame(() => r.classList.remove('is-entering')), d);
      }
    });
  });

  /* =========================================================
     COLLECTIONS RAIL: drag to scroll + buttons
     ========================================================= */
  const rail = document.querySelector('[data-rail]');
  let rd = null;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    rd = { x: e.clientX, left: rail.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!rd) return;
    const dx = e.clientX - rd.x;
    if (Math.abs(dx) > 4) { rd.moved = true; rail.classList.add('is-grabbing'); }
    rail.scrollLeft = rd.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!rd) return;
    const moved = rd.moved;
    rd = null;
    rail.classList.remove('is-grabbing');
    if (moved) rail.addEventListener('click', (ev) => ev.preventDefault(), { capture: true, once: true });
  });
  const step = () => rail.querySelector('.tile').getBoundingClientRect().width + 16;
  document.querySelector('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  document.querySelector('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));

  /* =========================================================
     REVEALS, MENU, BAG
     ========================================================= */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  const menuBtn = document.querySelector('[data-menu-open]');
  const menu = document.querySelector('[data-menu]');
  const setMenu = (open) => {
    root.classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    menu.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('is-locked', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('is-menu-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  const bag = document.querySelector('[data-bag]');
  const setBag = (open) => {
    root.classList.toggle('is-bag-open', open);
    bag.setAttribute('aria-hidden', String(!open));
    if (open) bag.querySelector('[data-bag-close]').focus();
  };
  document.querySelector('[data-bag-open]').addEventListener('click', () => setBag(true));
  document.querySelectorAll('[data-bag-close], [data-scrim]').forEach((el) => el.addEventListener('click', () => setBag(false)));

  /* =========================================================
     STORY VIEW: full story + quick story
     ========================================================= */
  const storyEl = document.querySelector('[data-story]');
  const storyBody = document.querySelector('[data-story-body]');
  const modeBtn = document.querySelector('[data-mode-toggle]');
  let current = null;
  let mode = 'full';
  let qi = 0;
  let lastFocus = null;

  const saved = () => { try { return JSON.parse(localStorage.getItem('sm4-saved') || '[]'); } catch (e) { return []; } };
  const setSaved = (list) => { try { localStorage.setItem('sm4-saved', JSON.stringify(list)); } catch (e) {} };

  const splitTitle = (t) => {
    const w = t.split(' ');
    const mid = Math.ceil(w.length / 2);
    const lines = w.length > 3 ? [w.slice(0, mid).join(' '), w.slice(mid).join(' ')] : [t];
    return lines.map((l, i) => `<span class="ln"><span style="animation-delay:${0.08 * i + 0.1}s">${esc(l)}</span></span>`).join('');
  };

  const fullHTML = (s) => {
    const idx = S.indexOf(s);
    const nx = S[(idx + 1) % S.length];
    const isSaved = saved().includes(s.id);
    return `
    <article class="article">
      <nav class="crumbs fade-in" aria-label="Breadcrumb"><span>Home</span><span>Archive</span><span>${esc(s.topic)}</span><span>${esc(s.title)}</span></nav>
      <div class="byline fade-in"><span class="byline__mark">SM</span><b>Santalum Maison</b><span>${esc(s.date)}</span><span>${esc(s.time)}</span></div>
      <h1>${splitTitle(s.title)}</h1>
      <div class="tools fade-in" style="animation-delay:.2s">
        <button data-save aria-pressed="${isSaved}"><i class="ph-light ph-bookmark-simple"></i> ${isSaved ? 'Saved' : 'Save'}</button>
        <button data-share><i class="ph-light ph-share-network"></i> Share</button>
      </div>
      <figure class="hero-img"><img src="${img(s.image, 2000)}" alt="${esc(s.alt)}" style="view-transition-name: story-image" /></figure>
      <div class="prose">
        <p class="lede fade-in" style="animation-delay:.25s">${esc(s.lede)}</p>
        ${s.body.slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
        <blockquote><span>${esc(s.quote)}</span></blockquote>
        ${s.body.slice(2).map((p) => `<p>${esc(p)}</p>`).join('')}
        <a class="next" href="#story-${nx.id}" data-open="${nx.id}" style="--tint:${nx.tint}">
          <img src="${img(nx.image, 300)}" alt="" loading="lazy" />
          <span><small>Up next</small><strong>${esc(nx.title)}</strong></span>
          <span class="card__open" aria-hidden="true"><i class="ph-light ph-arrow-right"></i></span>
        </a>
      </div>
    </article>`;
  };

  const quickHTML = (s) => `
    <div class="quick">
      <div class="quick__side fade-in">
        <p class="quick__hint">${esc(s.topic)}, ${esc(s.time)}</p>
        <h1>${esc(s.title)}</h1>
        <p>${esc(s.lede)}</p>
      </div>
      <div class="qs" data-qs aria-roledescription="story slides" aria-live="polite">
        <div class="qs__bars">${s.slides.map(() => '<i></i>').join('')}</div>
        ${s.slides.map((sl, i) => `<img class="qs__img" src="${img(sl.img, 900)}" alt="" data-qi="${i}" ${i === 0 ? 'style="view-transition-name: story-image"' : ''} />`).join('')}
        <button class="qs__tap qs__tap--prev" data-qs-prev aria-label="Previous slide"></button>
        <button class="qs__tap qs__tap--next" data-qs-next aria-label="Next slide"></button>
        <div class="qs__sheet" data-qs-sheet>
          <h3 data-qs-h></h3>
          <p data-qs-t></p>
          <div class="qs__foot"><span class="qs__count" data-qs-count></span><button class="qs__next" data-qs-next aria-label="Next slide"><i class="ph-light ph-arrow-right"></i></button></div>
        </div>
      </div>
      <div class="quick__side quick__side--r fade-in"><p class="quick__hint">Tap, swipe or use the arrow keys.</p></div>
    </div>`;

  const setSlide = (i) => {
    const s = current;
    const n = s.slides.length;
    const qs = storyBody.querySelector('[data-qs]');
    if (!qs) return;
    qi = Math.max(0, Math.min(n - 1, i));
    qs.querySelectorAll('.qs__img').forEach((im, k) => im.classList.toggle('is-on', k === qi));
    qs.querySelectorAll('.qs__bars i').forEach((b, k) => b.classList.toggle('is-done', k <= qi));
    const sheet = qs.querySelector('[data-qs-sheet]');
    sheet.classList.add('is-out');
    setTimeout(() => {
      qs.querySelector('[data-qs-h]').textContent = s.slides[qi].h;
      qs.querySelector('[data-qs-t]').textContent = s.slides[qi].t;
      qs.querySelector('[data-qs-count]').textContent = `${String(qi + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`;
      sheet.classList.remove('is-out');
    }, reduced ? 0 : 180);
  };

  const render = () => {
    storyBody.innerHTML = mode === 'full' ? fullHTML(current) : quickHTML(current);
    modeBtn.setAttribute('aria-checked', String(mode === 'quick'));
    storyEl.scrollTop = 0;
    if (mode === 'quick') {
      qi = 0;
      setSlide(0);
      const qs = storyBody.querySelector('[data-qs]');
      let sx = null;
      qs.addEventListener('pointerdown', (e) => { sx = e.clientX; });
      qs.addEventListener('pointerup', (e) => {
        if (sx === null) return;
        const dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 50) setSlide(qi + (dx < 0 ? 1 : -1));
      });
    }
  };

  const withTransition = (fn, from) => {
    const vt = !reduced && document.startViewTransition;
    const fromImg = from && from.querySelector('img');
    if (fromImg) fromImg.style.viewTransitionName = 'story-image';
    if (!vt) { fn(); if (fromImg) fromImg.style.viewTransitionName = ''; return; }
    const t = document.startViewTransition(() => {
      if (fromImg) fromImg.style.viewTransitionName = '';
      fn();
    });
    t.finished.finally(() => { if (fromImg) fromImg.style.viewTransitionName = ''; });
  };

  function openStory(id, opts = {}) {
    const s = byId[id];
    if (!s) return;
    const show = () => {
      current = s;
      mode = opts.mode || 'full';
      render();
      storyEl.hidden = false;
      body.classList.add('is-locked');
      storyEl.focus({ preventScroll: true });
    };
    if (!storyEl.hidden) { show(); }
    else { lastFocus = document.activeElement; withTransition(show, opts.from); }
    if (location.hash !== `#story-${id}`) history.pushState({ story: id }, '', `#story-${id}`);
  }

  const closeStory = (push = true) => {
    if (storyEl.hidden) return;
    withTransition(() => {
      storyEl.hidden = true;
      body.classList.remove('is-locked');
      storyBody.innerHTML = '';
      current = null;
    });
    if (push && location.hash.startsWith('#story-')) history.pushState({}, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  // Delegated openers: cards, rows, nav links, "up next"
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open]');
    if (!a) return;
    e.preventDefault();
    setMenu(false);
    openStory(a.dataset.open, { from: a.closest('.card, .row, .next') });
  });

  storyEl.addEventListener('click', async (e) => {
    if (e.target.closest('[data-story-close]')) closeStory();
    if (e.target.closest('[data-qs-next]')) setSlide(qi + 1);
    if (e.target.closest('[data-qs-prev]')) setSlide(qi - 1);
    const save = e.target.closest('[data-save]');
    if (save) {
      let list = saved();
      const on = !list.includes(current.id);
      list = on ? [...list, current.id] : list.filter((x) => x !== current.id);
      setSaved(list);
      save.setAttribute('aria-pressed', String(on));
      save.lastChild.textContent = on ? ' Saved' : ' Save';
    }
    const share = e.target.closest('[data-share]');
    if (share) {
      const url = location.href;
      try {
        if (navigator.share) await navigator.share({ title: current.title, url });
        else { await navigator.clipboard.writeText(url); share.lastChild.textContent = ' Link copied'; }
      } catch (err) { /* dismissed */ }
    }
  });

  modeBtn.addEventListener('click', () => {
    mode = mode === 'full' ? 'quick' : 'full';
    withTransition(render);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!storyEl.hidden) closeStory();
      setBag(false);
      setMenu(false);
    }
    if (!storyEl.hidden && mode === 'quick') {
      if (e.key === 'ArrowRight') setSlide(qi + 1);
      if (e.key === 'ArrowLeft') setSlide(qi - 1);
    }
  });

  // Back / forward buttons and deep links
  const fromHash = () => {
    const m = location.hash.match(/^#story-(\w+)/);
    if (m && byId[m[1]]) openStory(m[1]);
    else closeStory(false);
  };
  window.addEventListener('popstate', fromHash);
  if (location.hash.startsWith('#story-')) fromHash();
})();
