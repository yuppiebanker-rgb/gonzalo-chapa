/* ═══════════════════════════════════════════════════
   Gonzalo Chapa · Portfolio JS
   Vanilla — zero dependencies
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Theme toggle ──────────────────────────────────────── */
  (function() {
    var saved = localStorage.getItem('gcTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    function applyIcons(theme) {
      document.querySelectorAll('#iconMoon').forEach(function(el) { el.style.display = theme === 'dark' ? 'block' : 'none'; });
      document.querySelectorAll('#iconSun').forEach(function(el)  { el.style.display = theme === 'light' ? 'block' : 'none'; });
    }
    applyIcons(saved);

    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cur  = document.documentElement.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gcTheme', next);
        applyIcons(next);
      });
    });
  })();

  /* ── 1. LOADER — GONZALO TAKES THE SHOT ── */
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    var sil = loader ? loader.querySelector('.loader-silhouette') : null;
    var ring = loader ? loader.querySelector('.loader-click-ring') : null;
    var rays = loader ? loader.querySelector('.loader-rays') : null;
    var flash = loader ? loader.querySelector('.loader-flash') : null;
    if (!loader) return;

    // Full animation on first visit, quick flash on return visits
    var seen = sessionStorage.getItem('gcLoaderSeen');
    var shootDelay = seen ? 600 : 3000;
    var flashDelay = seen ? 800 : 3300;
    var revealDelay = seen ? 1000 : 3600;

    // Phase 1: Silhouette breathes
    // Phase 2: He shoots — recoil + ring + rays
    setTimeout(function() {
      if (sil) sil.classList.add('shoot');
      if (ring) ring.classList.add('fire');
      if (rays) rays.classList.add('fire');
    }, shootDelay);

    // Phase 3: FLASH
    setTimeout(function() {
      if (flash) {
        flash.style.transition = 'opacity .07s ease-in';
        flash.style.opacity = '1';
      }
    }, flashDelay);

    // Phase 4: Reveal site
    setTimeout(function() {
      if (flash) {
        flash.style.transition = 'opacity .5s ease-out';
        flash.style.opacity = '0';
      }
      loader.classList.add('out');
      sessionStorage.setItem('gcLoaderSeen', '1');
    }, revealDelay);
  });

  /* ── 2. MARQUEE DUPLICATE ── */
  document.querySelectorAll('.ticker-inner').forEach(function (el) {
    el.innerHTML += el.innerHTML;
  });

  /* ── 4. SCROLL HANDLERS ── */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('progress');
  var backTop = document.querySelector('.back-top');

  var scrollTicking = false;
  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      requestAnimationFrame(function() {
        var y    = window.scrollY;
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        if (nav) nav.classList.toggle('scrolled', y > 50);
        if (progress) progress.style.width = Math.min((y / docH) * 100, 100) + '%';
        if (backTop) backTop.classList.toggle('show', y > 400);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ── 5. HAMBURGER + OVERLAY ── */
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

  // Close overlay on link click — handle both naming conventions
  if (overlay) {
    overlay.querySelectorAll('a, .overlay-link, .overlay-hire, .nav-overlay-links a, .nav-overlay-cta').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* ── 6. SCROLL FADE-IN ── */
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

  /* ── 7. LIGHTBOX ── */
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

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    });

    /* Lightbox touch: swipe + pinch zoom */
    var ltx = 0, lty = 0, lpinch = 0, lscale = 1;
    lb.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) { ltx = e.touches[0].clientX; lty = e.touches[0].clientY; }
      if (e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        lpinch = Math.sqrt(dx*dx + dy*dy);
      }
    }, { passive: true });
    lb.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2 && lpinch > 0) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        lscale = Math.min(Math.max(Math.sqrt(dx*dx+dy*dy)/lpinch, 1), 3.5);
        if (lbImg) lbImg.style.transform = 'scale(' + lscale + ')';
      }
    }, { passive: true });
    lb.addEventListener('touchend', function(e) {
      if (e.touches.length === 0) {
        if (lscale > 1.15) {
          setTimeout(function() {
            lscale = 1;
            if (lbImg) { lbImg.style.transform = 'scale(1)'; lbImg.style.transition = 'transform .4s ease'; }
            setTimeout(function() { if (lbImg) lbImg.style.transition = ''; }, 400);
          }, 1800);
          lpinch = 0; return;
        }
        var dx = e.changedTouches[0].clientX - ltx;
        var dy = Math.abs(e.changedTouches[0].clientY - lty);
        if (Math.abs(dx) > 48 && dy < 80) { if (dx < 0) lbNext(); else lbPrev(); }
      }
      if (e.touches.length < 2) lpinch = 0;
    }, { passive: true });
  }

  /* ── 8. CONTACT FORM ── */
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

  /* ── 9. BACK TO TOP ── */
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 10. NAV ACTIVE LINKS ── */
  var path = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.nav-links a, .nav-overlay-links a').forEach(function (a) {
    var href = a.getAttribute('href').split('/').pop().replace('.html', '');
    if (href === path) a.classList.add('active');
  });

  /* ── 11. PAGE TRANSITIONS — CINEMATIC WIPE ── */
  (function() {
    var wipe = document.getElementById('pageWipe');

    document.querySelectorAll('a[href]').forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          link.target === '_blank' || link.hasAttribute('download')) return;
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var target = link.href;
        if (wipe) {
          wipe.classList.add('active');
          setTimeout(function() { window.location.href = target; }, 450);
        } else {
          window.location.href = target;
        }
      });
    });
  })();

  /* ── 12. IMAGE REVEAL ON SCROLL ── */
  var revealTargets = document.querySelectorAll(
    '.photo-item, .work-card, .bs-opener, .bs-wide, .bs-duo-cell, ' +
    '.bs-trio-cell, .bs-cell, .bs-bw, .rt-hero, .rt-cell, .rt-single, .page-hero'
  );

  if (revealTargets.length) {
    var revealObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function() {
            entry.target.classList.add('img-revealed');
          }, Math.min(i * 60, 300));
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealTargets.forEach(function(el) { revealObs.observe(el); });
  }

  /* ── 13. HERO SLIDESHOW ── */
  (function() {
    var slides   = document.querySelectorAll('.hero-slide');
    var dotsWrap = document.getElementById('heroDots');
    var slideNum = document.getElementById('slideNum');
    if (!slides.length || !dotsWrap) return;

    var curSlide   = 0;
    var slideTimer;

    var locations = [
      'Brookside Series',
      'Monterrey \u00b7 Calles',
      'Eventos \u00b7 Live',
      'Retratos',
      'Brookside'
    ];

    var heroLoc = document.getElementById('heroLoc');

    // Build dots
    slides.forEach(function(_, i) {
      var d = document.createElement('div');
      d.className = 'hdot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', function() { clearInterval(slideTimer); goTo(i); startTimer(); });
      dotsWrap.appendChild(d);
    });

    function goTo(n) {
      slides[curSlide].classList.remove('active');
      dotsWrap.children[curSlide].classList.remove('active');
      curSlide = (n + slides.length) % slides.length;
      slides[curSlide].classList.add('active');
      dotsWrap.children[curSlide].classList.add('active');
      if (slideNum) slideNum.textContent = String(curSlide + 1).padStart(2, '0');
      // Update location stamp
      if (heroLoc && locations[curSlide]) {
        heroLoc.style.opacity = '0';
        setTimeout(function() {
          heroLoc.textContent = locations[curSlide];
          heroLoc.style.opacity = '1';
        }, 350);
      }
    }

    function startTimer() {
      slideTimer = setInterval(function() { goTo(curSlide + 1); }, 5500);
    }
    startTimer();
  })();

  /* ── 14. HERO PARALLAX ON MOUSE ── */
  (function() {
    var hero = document.getElementById('hero');
    var deck = document.getElementById('heroDeck');
    if (!hero || !deck) return;

    hero.addEventListener('mousemove', function(e) {
      var x = (e.clientX / window.innerWidth  - 0.5) * 10;
      var y = (e.clientY / window.innerHeight - 0.5) * 7;
      deck.style.transform = 'scale(1.04) translate(' + (x * 0.3) + 'px,' + (y * 0.3) + 'px)';
    }, { passive: true });
  })();

  /* ── 15. FILM STRIP DRAG ── */
  (function(){
    var strip = document.getElementById('filmStrip');
    if (!strip) return;
    var down = false, sx, sl;
    strip.addEventListener('mousedown', function(e) { down = true; sx = e.pageX - strip.offsetLeft; sl = strip.scrollLeft; });
    strip.addEventListener('mouseleave', function() { down = false; });
    strip.addEventListener('mouseup', function() { down = false; });
    strip.addEventListener('mousemove', function(e) { if (!down) return; e.preventDefault(); strip.scrollLeft = sl - (e.pageX - strip.offsetLeft - sx) * 1.4; });
  })();

  /* ── 16. SMOOTH SCROLL FOR ANCHOR LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ── 17. WHATSAPP CTA — PER PAGE TEXT ── */
  (function() {
    var waText = document.getElementById('waText');
    var waFloat = document.getElementById('waFloat');
    if (!waText || !waFloat) return;

    var page = window.location.pathname.split('/').pop().replace('.html', '');
    var messages = {
      'street': { text: 'Street Session', msg: 'Hola Gonzalo, me interesa una sesión de street photography.' },
      'eventos': { text: 'Cotizar Evento', msg: 'Hola Gonzalo, quiero cotizar cobertura para un evento.' },
      'retratos': { text: 'Agendar Retratos', msg: 'Hola Gonzalo, quiero agendar una sesión de retratos.' },
      'brookside': { text: 'Brookside Session', msg: 'Hola Gonzalo, me interesa una sesión tipo Brookside.' },
      'hire': { text: 'Contratar', msg: 'Hola Gonzalo, vi tu portafolio y me gustaría contratarte.' },
      'about': { text: 'Contactar', msg: 'Hola Gonzalo, vi tu portafolio y quiero contactarte.' },
      'book': { text: 'Reservar', msg: 'Hola Gonzalo, quiero reservar una sesión.' }
    };

    var config = messages[page];
    if (config) {
      waText.textContent = config.text;
      waFloat.href = 'https://wa.me/528187997500?text=' + encodeURIComponent(config.msg);
    }
  })();

  /* ── 18. INSTAGRAM GRID STAGGER ── */
  (function() {
    var igCells = document.querySelectorAll('.ig-cell');
    if (!igCells.length) return;

    var igObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var idx = Array.from(igCells).indexOf(e.target);
          setTimeout(function() {
            e.target.style.opacity = '1';
            e.target.style.transform = 'none';
          }, idx * 80);
          igObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });

    igCells.forEach(function(cell) {
      cell.style.opacity = '0';
      cell.style.transform = 'scale(.94)';
      cell.style.transition = 'opacity .7s ease, transform .7s ease';
      igObs.observe(cell);
    });
  })();

  /* ── 19. BLUR-UP IMAGE LOADING ── */
  (function() {
    var imgs = document.querySelectorAll('.ph, .work-card-img, .ig-cell img, .film-frame img, .hero-slide img');
    imgs.forEach(function(img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function() {
          img.classList.add('loaded');
        });
        img.addEventListener('error', function() {
          img.classList.add('loaded'); // Remove blur even on error
        });
      }
    });
  })();

  /* ── 20. PARALLAX ON SCROLL ── */
  (function() {
    // Only on desktop — parallax is janky on mobile
    if (window.matchMedia('(hover: none)').matches) return;

    var parallaxEls = document.querySelectorAll('.work-card-img, .page-hero img, .hero-slide img');
    if (!parallaxEls.length) return;

    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var scrollY = window.scrollY;
          parallaxEls.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            var center = rect.top + rect.height / 2;
            var offset = (center / window.innerHeight - 0.5) * 30;
            el.style.objectPosition = 'center calc(50% + ' + offset + 'px)';
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ── 21. SCROLL-TRIGGERED COUNTER ANIMATION ── */
  (function() {
    var counts = document.querySelectorAll('.work-card-info .count');
    if (!counts.length) return;

    var countObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var text = el.textContent;
        var match = text.match(/(\d+)/);
        if (!match) return;

        var target = parseInt(match[1]);
        var suffix = text.replace(match[1], '').trim();
        var start = 0;
        var duration = 1200;
        var startTime = null;

        function animate(time) {
          if (!startTime) startTime = time;
          var progress = Math.min((time - startTime) / duration, 1);
          // Ease out cubic
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.round(eased * target);
          el.textContent = current + ' ' + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
        countObs.unobserve(el);
      });
    }, { threshold: 0.5 });

    counts.forEach(function(el) { countObs.observe(el); });
  })();

  /* ── 22. LIGHTBOX SHARE BUTTON ── */
  (function() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;

    // Add share button if not exists
    if (!lb.querySelector('.lb-share')) {
      var shareBtn = document.createElement('button');
      shareBtn.className = 'lb-share';
      shareBtn.innerHTML = '&#8599;';
      shareBtn.title = 'Share';
      shareBtn.style.cssText = 'position:absolute;top:20px;left:36px;font-size:22px;color:var(--cream);opacity:.5;cursor:pointer;background:none;border:none;transition:opacity .3s;z-index:2;min-width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;';
      shareBtn.addEventListener('mouseenter', function() { shareBtn.style.opacity = '1'; });
      shareBtn.addEventListener('mouseleave', function() { shareBtn.style.opacity = '.5'; });
      shareBtn.addEventListener('click', function() {
        var img = lb.querySelector('img');
        if (!img || !img.src) return;
        if (navigator.share) {
          navigator.share({ title: 'Gonzalo Chapa Photography', url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href).then(function() {
            shareBtn.innerHTML = '&#10003;';
            setTimeout(function() { shareBtn.innerHTML = '&#8599;'; }, 1500);
          });
        }
      });
      lb.appendChild(shareBtn);
    }
  })();

})();
