/* ═══════════════════════════════════════════════════
   Gonzalo Chapa · Supabase Content Loader v2
   Fetches directly from Supabase and patches the DOM.
   Falls back silently to static HTML on any error.
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SB_URL  = 'https://pxqugqerodswtkgxzipw.supabase.co';
  var SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cXVncWVyb2Rzd3RrZ3h6aXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI2MDgsImV4cCI6MjA5NTM5ODYwOH0.A_78sl-5gcAVuhCR4cBwRbipWcPS7OV0xXhb57Uv_rk';
  var CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  /* ── Page detection ──────────────────────────────── */
  var pathParts = window.location.pathname.replace(/\/$/, '').split('/');
  var pageSlug  = (pathParts[pathParts.length - 1] || 'index').replace('.html', '') || 'index';

  var isIndex      = (pageSlug === 'index' || pageSlug === '');
  var isHire       = (pageSlug === 'hire');
  var isAbout      = (pageSlug === 'about');
  var hasPhotoGrid = !!document.querySelector('.photo-grid');
  var isEditorial  = (pageSlug === 'retratos' || pageSlug === 'brookside');

  /* ── Loading state: hide body until DB data applied ─ */
  document.body.style.opacity    = '0';
  document.body.style.transition = 'opacity 0.25s ease';
  var revealTimer = setTimeout(reveal, 1200);

  function reveal() {
    clearTimeout(revealTimer);
    document.body.style.opacity = '1';
  }

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
  function pad2(n) { return ('0' + n).slice(-2); }

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

  /* ── 1. SITE SETTINGS — ALL pages ────────────────── */
  function applySettings(s) {
    if (!s) return;

    /* Logo text → nav, footer variants, wipe overlay */
    if (s.logo_text) {
      qsa('.nav-logo, .footer-left, .footer-logo, .wipe-text').forEach(function (el) {
        el.textContent = s.logo_text;
      });
    }

    /* CSS custom properties */
    if (s.primary_color)
      document.documentElement.style.setProperty('--dust', s.primary_color);
    if (s.accent_color)
      document.documentElement.style.setProperty('--cream', s.accent_color);

    /* Typography */
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
        el.href  = href.replace(/wa\.me\/[0-9]+/, 'wa.me/' + num);
      });
    }

    /* Phone — update visible phone-number text in overlay-footer + contact-info */
    if (s.phone) {
      qsa('.overlay-footer a[href*="wa.me/"], .contact-info a[href*="wa.me/"]').forEach(function (el) {
        if (/^[\+\d\s\(\)\-\.]+$/.test(el.textContent.trim())) {
          el.textContent = s.phone;
        }
      });
    }

    /* Instagram — update all instagram.com hrefs + visible handle text */
    if (s.instagram_handle) {
      var handle = s.instagram_handle.replace(/^@/, '');
      var igUrl  = 'https://instagram.com/' + handle;
      qsa('[href*="instagram.com/"]').forEach(function (el) { el.href = igUrl; });
      qsa('.overlay-footer a[href*="instagram.com/"]').forEach(function (el) {
        el.textContent = '@' + handle;
      });
      var igHandleEl = qs('.ig-handle');
      if (igHandleEl) igHandleEl.textContent = '@' + handle + ' ↗';
    }

    /* Email — update mailto hrefs + visible email text */
    if (s.email) {
      qsa('a[href^="mailto:"]').forEach(function (el) {
        el.href = 'mailto:' + s.email;
        var t = el.textContent.trim();
        if (t.indexOf('@') !== -1 && t.indexOf('://') === -1) {
          el.textContent = s.email;
        }
      });
    }

    /* Additional social links (no-op if fields absent) */
    if (s.social_tiktok)   qsa('[href*="tiktok.com"]').forEach(function (el) { el.href = s.social_tiktok; });
    if (s.social_youtube)  qsa('[href*="youtube.com"]').forEach(function (el) { el.href = s.social_youtube; });
    if (s.social_facebook) qsa('[href*="facebook.com/"]').forEach(function (el) { el.href = s.social_facebook; });
    if (s.social_twitter)  qsa('[href*="twitter.com"],[href*="x.com/"]').forEach(function (el) { el.href = s.social_twitter; });
    if (s.social_linkedin) qsa('[href*="linkedin.com"]').forEach(function (el) { el.href = s.social_linkedin; });

    /* Footer copy line */
    if (s.footer_text) {
      qsa('.footer-center, .footer-copy, .footer-copyright').forEach(function (el) {
        el.textContent = s.footer_text;
      });
    }

    /* Custom CSS */
    if (s.custom_css) {
      var cssEl = document.getElementById('gcsl-custom-css');
      if (!cssEl) {
        cssEl    = document.createElement('style');
        cssEl.id = 'gcsl-custom-css';
        document.head.appendChild(cssEl);
      }
      cssEl.textContent = s.custom_css;
    }

    /* Custom JS */
    if (s.custom_js) {
      var oldJs = document.getElementById('gcsl-custom-js');
      if (oldJs) oldJs.parentNode.removeChild(oldJs);
      var jsEl         = document.createElement('script');
      jsEl.id          = 'gcsl-custom-js';
      jsEl.textContent = s.custom_js;
      document.body.appendChild(jsEl);
    }

    /* Maintenance mode — fullscreen overlay */
    if (s.maintenance_mode && !document.getElementById('gcsl-maintenance')) {
      var mo = document.createElement('div');
      mo.id  = 'gcsl-maintenance';
      mo.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0906;' +
                         'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0';
      mo.innerHTML = '<div style="font-family:serif;font-style:italic;font-size:2rem;color:#c0a46e;margin-bottom:12px">' +
                     escHtml(s.logo_text || 'G. Chapa') + '</div>' +
                     '<div style="font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(244,239,230,.45)">Coming Soon</div>';
      document.body.appendChild(mo);
    }
  }

  /* ── 2. HERO SLIDESHOW (index only) ──────────────── */
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

  /* ── 3. NAV ITEMS — ALL pages ────────────────────── */
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

    /* Rebuild .nav-links — replace children, preserve wrapper */
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

    /* Rebuild overlay links */
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
        if (span && lbl)  span.textContent = lbl;
        else if (lbl)     btn.textContent  = lbl;
        if (cta.href)     btn.href         = cta.href;
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

  /* ── 5. PER-PAGE SEO — ALL pages ─────────────────── */
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

  /* ── 6. GALLERY — .photo-grid pages (street, eventos) */
  function applyGallery(photos) {
    if (!photos || !photos.length) return;
    var grid = qs('.photo-grid');
    if (!grid) return;

    var cap0 = pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1) + ' · GC';

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

    /* Wire lightbox — use main.js internals if available */
    if (window._gcGallery && window._gcOpenLb) {
      window._gcGallery.splice(0, window._gcGallery.length);
      photos.forEach(function (p) {
        window._gcGallery.push({ src: p.image_url || '', caption: p.caption || p.alt_text || '' });
      });
      qsa('.photo-item[data-src]').forEach(function (el, i) {
        el.addEventListener('click', (function (idx) {
          return function () { window._gcOpenLb(idx); };
        }(i)));
      });
    } else {
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
          if (lbImg)     lbImg.src             = sbGallery[i].src;
          if (lbCaption) lbCaption.textContent  = sbGallery[i].caption;
          if (lbCounter) lbCounter.textContent  = (i + 1) + ' / ' + sbGallery.length;
          lb.classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      });
    }
  }

  /* ── 7. EDITORIAL PHOTOS — retratos & brookside ──── */
  /*   Updates img.ph elements in document order from   */
  /*   DB photos, preserving the editorial layout DOM.  */
  function applyEditorialPhotos(photos) {
    if (!photos || !photos.length) return;
    var containers = [].slice.call(qsa(
      '.editorial-full, .ed-panel, .editorial-closer,' +
      '.narr-item, .narr-full, .narr-peak'
    ));
    if (!containers.length) return;

    photos.forEach(function (p, i) {
      if (i >= containers.length || !p.image_url) return;
      var el  = containers[i];
      var img = el.querySelector('img.ph');
      if (img) {
        img.src = p.image_url;
        if (p.alt_text) img.alt = p.alt_text;
      }
      el.setAttribute('data-src', p.image_url);
      var cap = p.caption || p.alt_text || '';
      if (cap) el.setAttribute('data-caption', cap);
      var captionEl = el.querySelector('.caption-overlay');
      if (captionEl && p.caption) captionEl.textContent = p.caption;
    });
  }

  /* ── 8. SERVICES (hire.html) ─────────────────────── */
  function applyServices(services) {
    if (!services || !services.length) return;
    var container = qs('.service-rows');
    if (!container) return;

    container.innerHTML = services.map(function (svc, i) {
      var isActive  = !!svc.active;
      var priceNum  = svc.base_price_mxn ? Math.round(svc.base_price_mxn / 100) : 0;
      var priceHtml = priceNum > 0
        ? '<span style="display:block;margin-top:6px;font-size:.7rem;letter-spacing:.1em;color:var(--dust);">desde $' +
          priceNum.toLocaleString('es-MX') + ' MXN</span>'
        : '';
      var badge = isActive ? 'badge-active' : 'badge-soon';
      var tag   = isActive ? (svc.type || svc.name || '') : 'Coming Soon';

      return '<div class="service-row fi">' +
        '<div class="service-num">' + pad2(i + 1) + '</div>' +
        '<div class="service-name">' + escHtml(svc.name || '') + '</div>' +
        '<div class="service-desc">' + escHtml(svc.description || '') + priceHtml + '</div>' +
        '<div class="service-tags"><span class="service-tag ' + badge + '">' +
        escHtml(tag) + '</span></div>' +
        '</div>';
    }).join('');
  }

  /* ── 9. ABOUT CONTENT (about.html) ───────────────── */
  function applyAbout(d) {
    if (!d) return;
    var portrait = document.getElementById('aboutPortrait');
    var label    = document.getElementById('aboutLabel');
    var headline = document.getElementById('aboutHeadline');
    var bio      = document.getElementById('aboutBio');
    if (d.portrait_url && portrait) portrait.src      = d.portrait_url;
    if (d.subheadline  && label)    label.textContent  = d.subheadline;
    if (d.headline     && headline) headline.innerHTML  = d.headline;
    if (d.bio_text     && bio)      bio.innerHTML       = d.bio_text;
  }

  /* ── Main: fire all fetches in parallel ──────────── */
  function run(sb) {

    /* Named fetch map — avoids fragile positional indexing */
    var fetches = {
      settings: sb.from('site_settings').select('*').limit(1).single(),
      nav:      sb.from('nav_items').select('*').eq('visible', true).order('sort_order'),
      seo:      sb.from('page_seo').select('*').eq('page_slug', pageSlug).maybeSingle()
    };

    if (isIndex) {
      fetches.hero     = sb.from('hero_slides').select('*').eq('active', true).order('sort_order');
      fetches.sections = sb.from('section_visibility').select('*').order('sort_order');
    }
    if (isHire) {
      fetches.services = sb.from('services').select('*').order('sort_order');
    }
    if (isAbout) {
      fetches.about = sb.from('about_content').select('*').limit(1).single();
    }

    var keys = Object.keys(fetches);

    Promise.all(keys.map(function (k) { return fetches[k]; }))
      .then(function (results) {
        var data = {};
        keys.forEach(function (k, i) { data[k] = results[i].data; });

        try { applySettings(data.settings); } catch (e) { console.warn('[gcsl] settings', e); }
        try { applyNav(data.nav);           } catch (e) { console.warn('[gcsl] nav', e); }
        try { applySeo(data.seo);           } catch (e) { console.warn('[gcsl] seo', e); }

        if (isIndex) {
          try { applyHero(data.hero);         } catch (e) { console.warn('[gcsl] hero', e); }
          try { applySections(data.sections); } catch (e) { console.warn('[gcsl] sections', e); }
        }
        if (isHire) {
          try { applyServices(data.services); } catch (e) { console.warn('[gcsl] services', e); }
        }
        if (isAbout) {
          try { applyAbout(data.about);       } catch (e) { console.warn('[gcsl] about', e); }
        }

        reveal();
      })
      .catch(function (e) {
        console.warn('[gcsl] main fetch failed', e);
        reveal();
      });

    /* Gallery pages with .photo-grid (street, eventos) */
    if (hasPhotoGrid) {
      sb.from('collections').select('id').eq('slug', pageSlug).maybeSingle()
        .then(function (res) {
          if (!res || !res.data) return null;
          return sb.from('photos').select('*')
            .eq('collection_id', res.data.id).order('sort_order');
        })
        .then(function (res) {
          if (res && res.data && res.data.length) {
            try { applyGallery(res.data); } catch (e) { console.warn('[gcsl] gallery', e); }
          }
        })
        .catch(function (e) { console.warn('[gcsl] gallery fetch', e); });
    }

    /* Editorial pages: update existing img.ph elements (retratos, brookside) */
    if (isEditorial) {
      sb.from('collections').select('id').eq('slug', pageSlug).maybeSingle()
        .then(function (res) {
          if (!res || !res.data) return null;
          return sb.from('photos').select('*')
            .eq('collection_id', res.data.id).order('sort_order');
        })
        .then(function (res) {
          if (res && res.data && res.data.length) {
            try { applyEditorialPhotos(res.data); } catch (e) { console.warn('[gcsl] editorial', e); }
          }
        })
        .catch(function (e) { console.warn('[gcsl] editorial fetch', e); });
    }
  }

  /* ── Bootstrap: load SDK if needed, then run ─────── */
  function boot() {
    try {
      /* Cache-Control headers prevent browser/CDN from serving stale API responses */
      run(window.supabase.createClient(SB_URL, SB_KEY, {
        global: { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
      }));
    } catch (e) {
      console.warn('[gcsl] boot failed', e);
      reveal();
    }
  }

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    boot();
  } else {
    var sdkScript     = document.createElement('script');
    sdkScript.src     = CDN_URL;
    sdkScript.onload  = boot;
    sdkScript.onerror = function () {
      console.warn('[gcsl] SDK load failed');
      reveal();
    };
    document.head.appendChild(sdkScript);
  }

}());
