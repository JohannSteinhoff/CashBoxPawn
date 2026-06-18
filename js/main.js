/* Cash Box Pawn — interactivity */
(function () {
  'use strict';

  // Enable scroll-reveal styling only when JS is running; ?noanim disables
  // animations entirely (useful for full-page screenshots / testing).
  document.documentElement.classList.add('js');
  if (new URLSearchParams(location.search).has('noanim')) {
    document.documentElement.classList.add('no-anim');
  }

  /* ---------- Store hours ----------
     VERIFY WITH OWNER before launch. Pulled from the storefront sign +
     old site ("09:00 am – 06:30 pm"). 24h format, null = closed.
     Order: Sun, Mon, Tue, Wed, Thu, Fri, Sat (matches Date.getDay()). */
  var HOURS = [
    { open: '12:00', close: '17:00' }, // Sun
    { open: '09:00', close: '18:30' }, // Mon
    { open: '09:00', close: '18:30' }, // Tue
    { open: '09:00', close: '18:30' }, // Wed
    { open: '09:00', close: '18:30' }, // Thu
    { open: '09:00', close: '18:30' }, // Fri
    { open: '10:00', close: '17:00' }  // Sat
  ];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function fmt12(t) {
    var p = t.split(':'), h = +p[0], m = p[1];
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ap;
  }

  function minutes(t) {
    var p = t.split(':');
    return (+p[0]) * 60 + (+p[1]);
  }

  // Store hours are Central Time regardless of where the visitor is.
  function storeNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  }

  function renderHours() {
    var table = document.getElementById('hoursTable');
    if (!table) return;
    var today = storeNow().getDay();
    var rows = '';
    // Display Monday-first
    for (var i = 1; i <= 7; i++) {
      var d = i % 7;
      var h = HOURS[d];
      rows += '<tr' + (d === today ? ' class="today"' : '') + '><td>' + DAY_NAMES[d] + '</td><td>' +
        (h ? fmt12(h.open) + ' – ' + fmt12(h.close) : 'Closed') + '</td></tr>';
    }
    table.innerHTML = rows;
  }

  // "45 min", "2 h", "2 h 15 min" — for the open/closed badge
  function fmtDelta(mins) {
    if (mins < 60) return mins + ' min';
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  function renderOpenStatus() {
    var now = storeNow();
    var day = now.getDay();
    var h = HOURS[day];
    var mins = now.getHours() * 60 + now.getMinutes();
    var text, isOpen = false;
    if (h && mins >= minutes(h.open) && mins < minutes(h.close)) {
      isOpen = true;
      text = 'Open now · closes in ' + fmtDelta(minutes(h.close) - mins) + ' (' + fmt12(h.close) + ')';
    } else if (h && mins < minutes(h.open)) {
      text = 'Closed now · opens in ' + fmtDelta(minutes(h.open) - mins) + ' (' + fmt12(h.open) + ')';
    } else {
      // After closing (or a day off): find the next day with hours
      text = 'Closed now';
      for (var i = 1; i <= 7; i++) {
        var next = HOURS[(day + i) % 7];
        if (next) {
          text += ' · opens in ' + fmtDelta(i * 1440 + minutes(next.open) - mins) + ' (' + fmt12(next.open) + ')';
          break;
        }
      }
    }
    ['openChipHero', 'openChipVisit'].forEach(function (id) {
      var chip = document.getElementById(id);
      if (!chip) return;
      chip.hidden = false;
      chip.textContent = text;
      chip.classList.toggle('closed', !isOpen);
    });
  }

  /* ---------- Light / dark theme toggle ----------
     The active theme is applied before paint by an inline script in <head>;
     here we wire up the toggle button and persist the user's choice. */
  var themeToggle = document.getElementById('themeToggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var THEME_COLORS = { dark: '#101418', light: '#f7f4ed' };

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[theme]);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    if (persist) {
      try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    }
  }

  // Sync button label / meta with whatever the head script already applied
  applyTheme(document.documentElement.getAttribute('data-theme') || 'dark', false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next, true);
    });
  }

  // Follow the OS preference until the visitor makes an explicit choice
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      try { if (localStorage.getItem('theme')) return; } catch (err) { /* ignore */ }
      applyTheme(e.matches ? 'light' : 'dark', false);
    });
  }

  /* ---------- Sticky header ---------- */
  var header = document.getElementById('siteHeader');
  var toTop = document.getElementById('toTop');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
    toTop.hidden = y < 600;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  function closeMenu() {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', function () {
    var open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    if (open) {
      var first = navMenu.querySelector('a');
      if (first) first.focus();
    }
  });
  navMenu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, target = +el.dataset.count, start = null;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Active nav link ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- Scroll lock ----------
     Setting body { overflow: hidden } doesn't stop touch-scrolling the page
     behind an overlay on mobile (notably iOS Safari). Pinning the body with
     position:fixed does, and we restore the scroll position on release. A
     counter keeps it locked while any overlay is open. */
  var scrollLockCount = 0, scrollLockY = 0;
  function lockScroll() {
    if (scrollLockCount++ > 0) return;
    scrollLockY = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    if (scrollLockCount === 0 || --scrollLockCount > 0) return;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    var prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto'; // avoid smooth-scroll jump
    window.scrollTo(0, scrollLockY);
    document.documentElement.style.scrollBehavior = prev;
  }

  /* ---------- Gallery lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.g-item img'));
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCounter = document.getElementById('lbCounter');
  var current = 0;

  function showLightbox(i) {
    current = (i + items.length) % items.length;
    lbImg.src = items[current].src;
    lbImg.alt = items[current].alt;
    lbCounter.textContent = (current + 1) + ' / ' + items.length;
    if (lightbox.hidden) { // only lock on the initial open, not on prev/next
      lightbox.hidden = false;
      lockScroll();
    }
  }
  function hideLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    unlockScroll();
  }
  items.forEach(function (img, i) {
    img.closest('.g-item').addEventListener('click', function () { showLightbox(i); });
  });
  document.getElementById('lbClose').addEventListener('click', hideLightbox);
  document.getElementById('lbPrev').addEventListener('click', function () { showLightbox(current - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { showLightbox(current + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) hideLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') hideLightbox();
    if (e.key === 'ArrowLeft') showLightbox(current - 1);
    if (e.key === 'ArrowRight') showLightbox(current + 1);
  });
  // basic swipe support
  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLightbox(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  /* ---------- Contact card modal ----------
     Tapping any phone-number link opens a card with call/copy actions,
     the address (map preview + copy) and, once EMAIL is set, an email row.
     Without JS the links stay plain tel: links. */
  var EMAIL = ''; // store's public email — leave '' to hide the email row

  var cModal = document.getElementById('contactModal');
  var cmClose = document.getElementById('cmClose');
  var cmMap = document.getElementById('cmMap');
  var cmOpener = null;

  if (EMAIL) {
    document.getElementById('cmEmailRow').hidden = false;
    document.getElementById('cmEmailValue').textContent = EMAIL;
    document.getElementById('cmEmailLink').href = 'mailto:' + EMAIL;
    document.getElementById('cmEmailCopy').dataset.copy = EMAIL;
  }

  function openContactModal() {
    cmOpener = document.activeElement;
    if (cmMap.dataset.src) { // load the map embed only when first needed
      cmMap.src = cmMap.dataset.src;
      cmMap.removeAttribute('data-src');
    }
    cModal.hidden = false;
    lockScroll();
    cmClose.focus();
  }
  function closeContactModal() {
    if (cModal.hidden) return;
    cModal.hidden = true;
    unlockScroll();
    if (cmOpener && cmOpener.focus) cmOpener.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) {
    if (cModal.contains(a)) return; // the card's own button must really dial
    a.addEventListener('click', function (e) {
      e.preventDefault();
      openContactModal();
    });
  });
  cmClose.addEventListener('click', closeContactModal);
  cModal.addEventListener('click', function (e) {
    if (e.target === cModal) closeContactModal();
  });
  document.addEventListener('keydown', function (e) {
    if (cModal.hidden) return;
    if (e.key === 'Escape') closeContactModal();
    if (e.key === 'Tab') { // keep focus inside the dialog
      var els = Array.prototype.filter.call(
        cModal.querySelectorAll('button, a[href]'),
        function (el) { return el.offsetParent !== null; }
      );
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { /* ignore */ }
    document.body.removeChild(ta);
    return ok;
  }

  Array.prototype.forEach.call(cModal.querySelectorAll('.cm-copy'), function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      function done(ok) {
        btn.textContent = ok ? '✓ Copied' : 'Copy failed';
        btn.classList.toggle('copied', ok);
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { done(true); },
          function () { done(legacyCopy(text)); }
        );
      } else {
        done(legacyCopy(text));
      }
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (form.action.indexOf('REPLACE_ME') !== -1) {
      status.textContent = 'Demo mode: connect a form service (e.g. Formspree) to enable sending. Meanwhile, call us at (512) 558-7296!';
      status.classList.add('err');
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('send failed');
      form.reset();
      status.textContent = "Thanks! We'll get back to you shortly.";
      status.classList.add('ok');
    }).catch(function () {
      status.textContent = 'Something went wrong — please call us at (512) 558-7296.';
      status.classList.add('err');
    }).finally(function () {
      btn.disabled = false;
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  renderHours();
  renderOpenStatus();
  setInterval(renderOpenStatus, 60000);
})();
