/* ═══════════════════════════════════════════════════
   Gonzalo Chapa · Supabase Content Loader
   Fetches directly from Supabase and patches the DOM.
   Falls back silently to static HTML on any error.
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SB_URL = 'https://pxqugqerodswtkgxzipw.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cXVncWVyb2Rzd3RrZ3h6aXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI2MDgsImV4cCI6MjA5NTM5ODYwOH0.A_78sl-5gcAVuhCR4cBwRbipWcPS7OV0xXhb57Uv_rk';
  var CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  /* ── Page slug detection ─────────────────────────── */
  var pathParts = window.location.pathname.replace(/\/$/, '').split('/');
  var pageSlug  = (pathParts[pathParts.length - 1] || 'index').replace('.html', '') || 'index';

  var isIndex      = (pageSlug === 'index' || pageSlug === '');
  var hasPhotoGrid = !!document.querySelector('.photo-grid');

  /* ── Helpers ─────────────────────────────────────── */
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  function escAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Section key → CSS selector ──────────────────── */
  var SECTION_MAP = {
    hero:           '.hero-v2',
    ticker:         '.ticker-section',
    'ticker-strip': '.ticker-section',
    works:          '.works-grid',
    filmstrip:      '.film-strip-wrap',
    'film-strip':   '.film-strip-wrap',
    instagram:      '.ig-section',
    ig:             '.ig-section',
    press:          '.press-strip',
    footer:         'footer'
  };

  /* ── Google Font helpers ──────────────────────────── */
  function loadGoogleFont(family) {
    var id = 'gcsl-gf-' + family.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;
    var link  = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
                family.replace(/\s+/g, '+') +
                ':ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }

  function injectFontOverride(type, family) {
    var id  = 'gcsl-font-' + type;
    var old = document.getElementById(id);
    if (old) old.parentNode.removeChild(old);
    var style       = document.createElement('style');
    style.id        = id;
    style.textContent =
      '.hero-title,.hero-v2-title,h1,h2,h3,' +
      '.about-headline,.page-hero-title,.contact-quote,blockquote{' +
      "font-family:'" + family + "',serif !important}";
    document.head.appendChild(style);
  }

  /* ── 1. SITE SETTINGS ─────────────────────────────── */
  function applySettings(s) {
    if (!s) return;

    if (s.logo_text) {
      qsa('.nav-logo, .footer-left, .wipe-text').forEach(function (el) {
        el.textContent = s.logo_text;
      });
    }

    if (s.primary_color)
      document.documentElement.style.setProperty('--dust', s.primary_color);
    if (s.accent_color)
      document.documentElement.style.setProperty('--cream', s.accent_color);

    if (s.font_heading) {
      loadGoogleFont(s.font_heading);
      injectFontOverride('heading', s.font_heading);
    }
    if (s.font_body) {
      loadGoogleFont(s.font_body);
      document.body.style.fontFamily = "'" + s.font_body + "', sans-serif";
    }

    /* WhatsApp — update all wa.me hrefs, preserving ?text= query */
    if (s.whatsapp_number) {
      var num = String(s.whatsapp_number).replace(/\D/g, '');
      qsa('[href*="wa.me/"]').forEach(function (el) {
        var href = el.getAttribute('href') || '';
        el.href = href.replace(/wa\.me\/[0-9]+/, 'wa.me/' + num);
      });
    }

    /* Instagram — update all instagram.com hrefs + visible handle text */
    if (s.instagram_handle) {
      var handle = s.instagram_handle.replace(/^@/, '');
      var igUrl  = 'https://instagram.com/' + handle;
      qsa('[href*="instagram.com/"]').forEach(function (el) { el.href = igUrl; });
      var igHandleEl = qs('.ig-handle');
      if (igHandleEl) igHandleEl.textContent = '@' + handle + ' ↗';
    }
  }

  /* ── 2. HERO SLIDESHOW (index only) ──────────────── */
  /*   Updates img src on existing slides. Does NOT     */
  /*   change slide count — main.js slideshow timer     */
  /*   captured the NodeList at init time.              */
  function applyHero(slides) {
    if (!slides || !slides.length) return;
    var deck = document.getElementById('heroDeck');
    if (!deck) return;

    var existing = deck.querySelectorAll('.hero-slide img');
    slides.forEach(function (slide, i) {
      if (!existing[i] || !slide.image_url) return;
      existing[i].src = slide.image_url;
      if (slide.alt_text) existing[i].alt = slide.alt_text;
      if (slide.location_label) {
        existing[i].setAttribute('data-location', slide.location_label);
        if (i === 0) {
          var locEl = document.getElementById('heroLoc');
          if (locEl) locEl.textContent = slide.location_label;
        }
      }
    });
  }

  /* ── 3. NAV ITEMS ─────────────────────────────────── */
  function applyNav(items) {
    if (!items || !items.length) return;
    var lang    = localStorage.getItem('gcLang') || 'es';
    var regular = items.filter(function (n) { return !n.is_cta; });
    var cta     = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].is_cta) { cta = items[i]; break; }
    }

    function labelFor(item) {
      return (lang === 'en' && item.label_en) ? item.label_en : (item.label || '');
    }

    /* Rebuild .nav-links — preserve <ul>/<div> wrapper, replace children */
    var navLinks = qs('.nav-links');
    if (navLinks) {
      var isUl = navLinks.tagName.toLowerCase() === 'ul';
      navLinks.innerHTML = regular.map(function (item) {
        var a = '<a href="' + escAttr(item.href || '#') + '"' +
                (item.label    ? ' data-es="' + escAttr(item.label)    + '"' : '') +
                (item.label_en ? ' data-en="' + escAttr(item.label_en) + '"' : '') +
                '>' + escHtml(labelFor(item)) + '</a>';
        return isUl ? '<li>' + a + '</li>' : a;
      }).join('');
    }

    /* Rebuild overlay links — .nav-overlay-links (index) or .overlay-links (pages) */
    var overlayLinks = qs('.nav-overlay-links') || qs('.overlay-links');
    if (overlayLinks) {
      overlayLinks.innerHTML = regular.map(function (item) {
        return '<a href="' + escAttr(item.href || '#') + '" class="overlay-link">' +
               escHtml(labelFor(item)) + '</a>';
      }).join('');
    }

    /* CTA / hire button — update in-place */
    if (cta) {
      var lbl = labelFor(cta);
      ['.hire-btn', '.nav-hire-landing', '.overlay-hire', '.nav-overlay-cta'].forEach(function (sel) {
        var btn = qs(sel);
        if (!btn) return;
        var span = btn.querySelector('span');
        if (span && lbl)      span.textContent = lbl;
        else if (lbl)         btn.textContent  = lbl;
        if (cta.href)         btn.href          = cta.href;
      });
    }
  }

  /* ── 4. SECTION VISIBILITY (index only) ──────────── */
  function applySections(sections) {
    if (!sections || !sections.length) return;

    sections.forEach(function (sec) {
      if (sec.page) {
        var p      = sec.page.toLowerCase();
        var isHome = isIndex && (p === 'home' || p === 'index');
        if (p !== pageSlug && !isHome) return;
      }

      var sel = SECTION_MAP[sec.section_key];
      if (!sel) return;

      var el = qs(sel);
      if (el) el.style.display = sec.visible ? '' : 'none';
    });
  }

  /* ── 5. PER-PAGE SEO ─────────────────────────────── */
  function applySeo(s) {
    if (!s) return;

    if (s.meta_title) {
      document.title = s.meta_title;
      var ogTitle = qs('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', s.meta_title);
      var twTitle = qs('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', s.meta_title);
    }

    if (s.meta_description) {
      var metaDesc = qs('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', s.meta_description);
      var ogDesc = qs('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', s.meta_description);
    }

    if (s.og_image_url) {
      var ogImg = qs('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute('content', s.og_image_url);
      var twImg = qs('meta[name="twitter:image"]');
      if (twImg) twImg.setAttribute('content', s.og_image_url);
    }

    if (s.noindex) {
      var robots = qs('meta[name="robots"]');
      if (!robots) {
        robots      = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    }
  }

  /* ── 6. GALLERY PHOTOS ───────────────────────────── */
  function applyGallery(photos) {
    if (!photos || !photos.length) return;
    var grid = qs('.photo-grid');
    if (!grid) return;

    var cap0 = pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1) + ' · GC';

    /* Rebuild gallery DOM */
    grid.innerHTML = photos.map(function (p, i) {
      var src = p.image_url || '';
      var alt = p.alt_text  || cap0;
      var cap = p.caption   || alt;
      return '<div class="photo-item" data-src="' + escAttr(src) +
             '" data-caption="' + escAttr(cap) + '">' +
             '<img class="ph" src="' + escAttr(src) + '" alt="' + escAttr(alt) + '"' +
             ' loading="' + (i < 4 ? 'eager' : 'lazy') + '"' +
             ' style="width:100%;display:block;object-fit:cover;">' +
             '<div class="caption-overlay">' + escHtml(cap) + '</div>' +
             '</div>';
    }).join('');

    /* Wire up lightbox — use main.js internals if exposed, else direct DOM */
    if (window._gcGallery && window._gcOpenLb) {
      /* Update main.js gallery array in-place so prev/next nav keeps working */
      window._gcGallery.splice(0, window._gcGallery.length);
      photos.forEach(function (p) {
        window._gcGallery.push({
          src:     p.image_url || '',
          caption: p.caption   || p.alt_text || ''
        });
      });
      qsa('.photo-item[data-src]').forEach(function (el, i) {
        el.addEventListener('click', (function (idx) {
          return function () { window._gcOpenLb(idx); };
        }(i)));
      });
    } else {
      /* Fallback: open lightbox directly (no prev/next via main.js) */
      var sbGallery = photos.map(function (p) {
        return { src: p.image_url || '', caption: p.caption || p.alt_text || '' };
      });
      var lb        = document.getElementById('lightbox');
      var lbImg     = lb ? lb.querySelector('img')         : null;
      var lbCaption = lb ? lb.querySelector('.lb-caption') : null;
      var lbCounter = document.getElementById('lb-counter');

      qsa('.photo-item[data-src]').forEach(function (el, i) {
        el.addEventListener('click', function () {
          if (!lb) return;
          if (lbImg)     lbImg.src                = sbGallery[i].src;
          if (lbCaption) lbCaption.textContent    = sbGallery[i].caption;
          if (lbCounter) lbCounter.textContent    = (i + 1) + ' / ' + sbGallery.length;
          lb.classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      });
    }
  }

  /* ── Main: fire all fetches in parallel ──────────── */
  function run(sb) {
    var fetches = [
      sb.from('site_settings').select('*').limit(1).single(),
      sb.from('nav_items').select('*').eq('visible', true).order('sort_order'),
      sb.from('page_seo').select('*').eq('page_slug', pageSlug).maybeSingle()
    ];

    if (isIndex) {
      fetches.push(
        sb.from('hero_slides').select('*').eq('active', true).order('sort_order'),
        sb.from('section_visibility').select('*').order('sort_order')
      );
    }

    Promise.all(fetches).then(function (results) {
      try { applySettings(results[0].data); } catch (e) {}
      try { applyNav(results[1].data);      } catch (e) {}
      try { applySeo(results[2].data);      } catch (e) {}
      if (isIndex) {
        try { applyHero(results[3].data);     } catch (e) {}
        try { applySections(results[4].data); } catch (e) {}
      }
    }).catch(function () {});

    /* Gallery pages: collection lookup → photos (two-step) */
    if (hasPhotoGrid) {
      sb.from('collections').select('id').eq('slug', pageSlug).maybeSingle()
        .then(function (res) {
          if (!res || !res.data) return null;
          return sb.from('photos')
            .select('*')
            .eq('collection_id', res.data.id)
            .order('sort_order');
        })
        .then(function (res) {
          if (res && res.data && res.data.length) {
            try { applyGallery(res.data); } catch (e) {}
          }
        })
        .catch(function () {});
    }
  }

  /* ── Bootstrap: load SDK if needed, then run ─────── */
  function boot() {
    try { run(window.supabase.createClient(SB_URL, SB_KEY)); } catch (e) {}
  }

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    boot();
  } else {
    var sdkScript    = document.createElement('script');
    sdkScript.src    = CDN_URL;
    sdkScript.onload = boot;
    sdkScript.onerror = function () {};
    document.head.appendChild(sdkScript);
  }

}());
