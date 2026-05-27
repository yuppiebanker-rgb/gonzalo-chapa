/* ═══════════════════════════════════════════════════
   Gonzalo Chapa · Dynamic Content Loader
   Fetches /api/content and patches the live DOM.
   Falls back silently to static HTML on any error.
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var API_URL = '/api/content';

  /* ── Helpers ─────────────────────────────────────── */
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  /* ── Detect current page slug ─────────────────────
     index.html  → 'index'
     pages/hire.html → 'hire'  */
  var pathParts = window.location.pathname.replace(/\/$/, '').split('/');
  var pageSlug = (pathParts[pathParts.length - 1] || 'index').replace('.html', '');
  if (!pageSlug || pageSlug === '') pageSlug = 'index';

  /* ── Section key → CSS selector map ──────────────── */
  var SECTION_MAP = {
    ticker:       '.ticker-section',
    film_strip:   '.film-strip-wrap',
    'film-strip': '.film-strip-wrap',
    filmstrip:    '.film-strip-wrap',
    works:        '.works-grid',
    works_grid:   '.works-grid',
    about:        '.about-strip',
    about_strip:  '.about-strip',
    instagram:    '.ig-section',
    ig:           '.ig-section',
    press:        '.press-strip',
    press_strip:  '.press-strip',
    hero:         '.page-hero',
    contact:      '.contact-section',
    services:     '.services-list,.service-rows',
    photo_grid:   '.photo-section'
  };

  /* ── Apply hero slides ────────────────────────────
     Only updates img[src] on existing slides.
     Does NOT change slide count — main.js's slideshow
     timer captured the NodeList at init time.          */
  function applyHero(heroSlides) {
    if (!heroSlides || !heroSlides.length) return;
    var deck = document.getElementById('heroDeck');
    if (!deck) return;

    var existing = deck.querySelectorAll('.hero-slide img');
    heroSlides.forEach(function (slide, i) {
      if (!existing[i] || !slide.image_url) return;
      existing[i].src = slide.image_url;
      if (slide.alt_text)       existing[i].alt = slide.alt_text;
      if (slide.location_label) existing[i].setAttribute('data-location', slide.location_label);
    });
  }

  /* ── Apply nav items ──────────────────────────────
     Updates label text and href in-place.
     Preserves HTML structure (index uses <div><a>,
     pages use <ul><li><a>).                           */
  function applyNav(navItems) {
    if (!navItems || !navItems.length) return;

    var lang = localStorage.getItem('gcLang') || 'es';
    var regular = navItems.filter(function (n) { return !n.is_cta; });
    var cta     = navItems.find(function (n) { return n.is_cta; });

    function labelFor(item) {
      return (lang === 'en' && item.label_en) ? item.label_en : item.label;
    }

    /* Desktop nav */
    var navLinks = qsa('.nav-links a');
    regular.forEach(function (item, i) {
      var el = navLinks[i];
      if (!el) return;
      var lbl = labelFor(item);
      if (lbl)      el.textContent = lbl;
      if (item.label)    el.setAttribute('data-es', item.label);
      if (item.label_en) el.setAttribute('data-en', item.label_en);
      if (item.href)     el.href = item.href;
    });

    /* Overlay nav — index uses .nav-overlay-links, pages use .overlay-links */
    var overlayLinks = qsa('.nav-overlay-links a, .overlay-links a');
    regular.forEach(function (item, i) {
      var el = overlayLinks[i];
      if (!el) return;
      var lbl = labelFor(item);
      if (lbl)       el.textContent = lbl;
      if (item.href) el.href = item.href;
    });

    /* CTA / hire button — multiple possible selectors across pages */
    if (cta) {
      ['.hire-btn', '.nav-hire-landing', '.overlay-hire'].forEach(function (sel) {
        var btn = qs(sel);
        if (!btn) return;
        var lbl = labelFor(cta);
        /* .overlay-hire wraps a <span> — update the span text if present */
        var span = btn.querySelector('span');
        if (span) span.textContent = lbl;
        else if (lbl) btn.textContent = lbl;
        if (cta.href) btn.href = cta.href;
      });
    }
  }

  /* ── Apply site settings ──────────────────────────
     logo_text    → nav logo + footer + wipe text
     primary_color → --dust CSS variable
     accent_color  → --cream CSS variable
     font_heading  → load & apply heading font
     font_body     → load & apply body font          */
  function applySettings(settings) {
    if (!settings) return;

    /* Logo text */
    if (settings.logo_text) {
      qsa('.nav-logo, .footer-left, .wipe-text').forEach(function (el) {
        el.textContent = settings.logo_text;
      });
    }

    /* Color tokens */
    if (settings.primary_color) {
      document.documentElement.style.setProperty('--dust', settings.primary_color);
    }
    if (settings.accent_color) {
      document.documentElement.style.setProperty('--cream', settings.accent_color);
    }

    /* Fonts */
    if (settings.font_heading) {
      loadGoogleFont(settings.font_heading);
      injectFontOverride('heading', settings.font_heading);
    }
    if (settings.font_body) {
      loadGoogleFont(settings.font_body);
      document.body.style.fontFamily = "'" + settings.font_body + "', sans-serif";
    }
  }

  function loadGoogleFont(family) {
    var id = 'gc-gf-' + family.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family='
      + family.replace(/\s+/g, '+')
      + ':ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }

  function injectFontOverride(type, family) {
    var id = 'gc-font-' + type;
    var existing = document.getElementById(id);
    if (existing) existing.parentNode.removeChild(existing);
    var style = document.createElement('style');
    style.id = id;
    /* Target the elements that use heading fonts in the design system */
    style.textContent = [
      '.hero-title, .hero-v2-title,',
      'h1, h2, h3,',
      '.about-headline, .page-hero-title,',
      '.contact-quote, blockquote {',
      "  font-family: '" + family + "', serif !important;",
      '}'
    ].join(' ');
    document.head.appendChild(style);
  }

  /* ── Apply section visibility ─────────────────────
     Filters by current page slug (or no page = global).
     section_key is matched against SECTION_MAP.        */
  function applySections(sections) {
    if (!sections || !sections.length) return;

    sections.forEach(function (sec) {
      /* Match sections assigned to this page, 'home'/'index' aliases,
         or sections with no page set (treat as global).               */
      if (sec.page) {
        var p = sec.page.toLowerCase();
        var isHome = (pageSlug === 'index' || pageSlug === '') &&
                     (p === 'home' || p === 'index');
        if (p !== pageSlug && !isHome) return;
      }

      var selector = SECTION_MAP[sec.section_key];
      if (!selector) return;

      selector.split(',').forEach(function (sel) {
        var el = qs(sel.trim());
        if (el) el.style.display = sec.visible ? '' : 'none';
      });
    });
  }

  /* ── Main ─────────────────────────────────────────── */
  function applyContent(data) {
    if (!data || typeof data !== 'object') return;
    applySettings(data.settings);
    applyHero(data.hero);
    applyNav(data.nav);
    applySections(data.sections);
  }

  fetch(API_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(applyContent)
    .catch(function () { /* silent fallback — static HTML remains */ });

})();
