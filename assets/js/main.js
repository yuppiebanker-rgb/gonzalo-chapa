/* ═══════════════════════════════════════════════════
   Gonzalo Chapa · Portfolio JS
   Vanilla — zero dependencies
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Theme toggle ──────────────────────────────────────────── */
  var themeToggles = document.querySelectorAll('.theme-toggle');
  var savedTheme = localStorage.getItem('gcTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function applyThemeIcons(theme) {
    themeToggles.forEach(function (btn) {
      var moon = btn.querySelector('.icon-moon');
      var sun  = btn.querySelector('.icon-sun');
      if (moon) moon.style.display = theme === 'dark'  ? 'block' : 'none';
      if (sun)  sun.style.display  = theme === 'light' ? 'block' : 'none';
    });
  }
  applyThemeIcons(savedTheme);

  themeToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gcTheme', next);
      applyThemeIcons(next);
    });
  });

  /* ── 1. LOADER ── */
  window.addEventListener('load', function () {
    setTimeout(function () {
      var loader = document.getElementById('loader');
      if (loader) loader.classList.add('out');
    }, 1400);
  });

  /* ── 2. MARQUEE DUPLICATE ── */
  document.querySelectorAll('.ticker-inner').forEach(function (el) {
    el.innerHTML += el.innerHTML;
  });

  /* ── 3. SCROLL HANDLERS ── */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('progress');
  var backTop = document.querySelector('.back-top');

  function onScroll() {
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - window.innerHeight;

    // Nav
    if (nav) {
      if (y > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }

    // Progress
    if (progress && docH > 0) {
      progress.style.width = (y / docH * 100) + '%';
    }

    // Back to top
    if (backTop) {
      if (y > 400) backTop.classList.add('show');
      else backTop.classList.remove('show');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 4. HAMBURGER + OVERLAY ── */
  var hamburger = document.getElementById('hamburger');
  var overlay = document.querySelector('.nav-overlay');
  var overlayClose = document.getElementById('overlayClose');

  function openNav() {
    if (!overlay || !hamburger) return;
    overlay.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    if (!overlay || !hamburger) return;
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', function () {
    overlay.classList.contains('open') ? closeNav() : openNav();
  });
  if (overlayClose) overlayClose.addEventListener('click', closeNav);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeNav();
      closeLb();
    }
  });

  // Close overlay on link click
  if (overlay) {
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* ── 5. SCROLL FADE-IN ── */
  var fiEls = document.querySelectorAll('.fi');
  if (fiEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fiEls.forEach(function (el) { io.observe(el); });
  }

  /* ── 6. LIGHTBOX ── */
  var lb = document.getElementById('lightbox');
  var lbImg = lb ? lb.querySelector('img') : null;
  var lbCaption = lb ? lb.querySelector('.lb-caption') : null;
  var lbCounter = document.getElementById('lb-counter');
  var gallery = [];
  var lbIdx = 0;

  document.querySelectorAll('[data-src]').forEach(function (el, i) {
    gallery.push({ src: el.getAttribute('data-src'), caption: el.getAttribute('data-caption') || '' });
    el.addEventListener('click', function () { openLb(i); });
  });

  function openLb(i) {
    if (!lb || !gallery.length) return;
    lbIdx = i;
    showLbImage();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function showLbImage() {
    if (!lbImg) return;
    lbImg.style.opacity = '0';
    setTimeout(function () {
      lbImg.src = gallery[lbIdx].src;
      if (lbCaption) lbCaption.textContent = gallery[lbIdx].caption;
      if (lbCounter) lbCounter.textContent = (lbIdx + 1) + ' / ' + gallery.length;
      lbImg.style.opacity = '1';
    }, 130);
  }
  function lbPrev() {
    lbIdx = (lbIdx - 1 + gallery.length) % gallery.length;
    showLbImage();
  }
  function lbNext() {
    lbIdx = (lbIdx + 1) % gallery.length;
    showLbImage();
  }

  if (lb) {
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', lbPrev);
    lb.querySelector('.lb-next').addEventListener('click', lbNext);
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLb();
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    });

    // Touch swipe + pinch zoom
    var tx = 0, ty = 0;
    var initialPinchDist = 0;
    var currentScale = 1;

    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
      }
      if (e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.sqrt(dx*dx + dy*dy);
      }
    }, { passive: true });

    lb.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        currentScale = Math.min(Math.max(dist / initialPinchDist, 1), 3);
        if (lbImg) lbImg.style.transform = 'scale(' + currentScale + ')';
      }
    }, { passive: true });

    lb.addEventListener('touchend', function (e) {
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        if (currentScale > 1.1) {
          /* pinch was active — reset scale after delay */
          setTimeout(function () {
            currentScale = 1;
            if (lbImg) lbImg.style.transform = 'scale(1)';
          }, 2000);
          return;
        }
        var dx = e.changedTouches[0].clientX - tx;
        var dy = Math.abs(e.changedTouches[0].clientY - ty);
        if (Math.abs(dx) > 50 && dy < 60) {
          if (dx < 0) lbNext(); else lbPrev();
        }
      }
      if (e.touches.length < 2) initialPinchDist = 0;
    }, { passive: true });
  }

  /* ── 7. CONTACT FORM ── */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var service = form.querySelector('[name="service"]').value;
      var message = form.querySelector('[name="message"]').value.trim();
      var text = 'Hola Gonzalo, soy ' + name + '. Servicio: ' + service + '. ' + message;
      window.open('https://wa.me/528187997500?text=' + encodeURIComponent(text), '_blank');
    });
  }

  /* ── 8. BACK TO TOP ── */
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 9. NAV ACTIVE LINKS ── */
  var path = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.nav-links a, .nav-overlay-links a').forEach(function (a) {
    var href = a.getAttribute('href').split('/').pop().replace('.html', '');
    if (href === path) a.classList.add('active');
  });

  /* ── Page transitions ──────────────────────────────── */
  document.body.classList.add('page-transition-in');

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('http') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      link.target === '_blank'
    ) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.href;
      document.body.classList.add('page-transition-out');
      setTimeout(() => { window.location.href = target; }, 340);
    });
  });

  /* ── Image reveal on scroll ────────────────────────── */
  const revealTargets = document.querySelectorAll(
    '.photo-item, .work-card, .bs-opener, .bs-wide, .bs-duo-cell, ' +
    '.bs-trio-cell, .bs-cell, .bs-bw, .rt-hero, .rt-cell, .rt-single, .page-hero'
  );

  if (revealTargets.length) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('img-revealed');
          }, Math.min(i * 60, 300));
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealTargets.forEach(el => revealObs.observe(el));
  }

  /* ── Photo cursor ──────────────────────────────────── */
  const photoCursor = document.getElementById('photoCursor');
  if (photoCursor) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      photoCursor.style.left = tx + 'px';
      photoCursor.style.top  = ty + 'px';
    });

    const photoTargets = document.querySelectorAll(
      '.photo-item, .work-card, .bs-opener, .bs-wide, .bs-duo-cell, ' +
      '.bs-trio-cell, .bs-cell, .bs-bw, .rt-hero, .rt-cell, .rt-single, .section-card'
    );
    photoTargets.forEach(el => {
      el.addEventListener('mouseenter', () => photoCursor.classList.add('active'));
      el.addEventListener('mouseleave', () => photoCursor.classList.remove('active'));
    });
  }

})();
