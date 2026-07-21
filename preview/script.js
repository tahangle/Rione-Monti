/* ==========================================================================
   Rione Monti — home page behaviour
   --------------------------------------------------------------------------
   A clean, dependency-free reimplementation of the interactions described in
   the design handoff. Nothing here is ported from the prototype runtime;
   it's plain vanilla JS driving the same look, motion and behaviour.

   Attribute conventions (converted from the design file):
     data-ref="name"      -> a scripted element we hold a handle to
     data-action="name"   -> click / submit handler, wired below
     data-hover="css"     -> inline styles applied while hovered
     data-en="string"     -> English copy for the FR/EN toggle
   ========================================================================== */
(function () {
  'use strict';

  var ref = function (name) { return document.querySelector('[data-ref="' + name + '"]'); };

  // ---- element handles -----------------------------------------------------
  var els = {};
  [
    'menuBtn', 'heroLogo', 'revealSec', 'philoPanel', 'galColL',
    'expSec', 'expPlates', 'expL1', 'expL2', 'expL3', 'expSub',
    'menuSec', 'revSec', 'menuTitle', 'menuList', 'menuMobile',
    'menuOverlay', 'langBtn'
  ].forEach(function (n) { els[n] = ref(n); });

  // ---- shared helpers ------------------------------------------------------
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var easeOutCubic = function (x) { return 1 - Math.pow(1 - x, 3); };

  // Shared text style for menu dishes (matches the design file)
  var dishStyle = "font-family:'Rauschen',sans-serif;font-weight:400;font-size:clamp(15px,1.15vw,18px);letter-spacing:0.07em;color:#1E194E;text-transform:uppercase;";

  // The menu, by category
  var cats = [
    ['Antipasti', ['Supplì', 'Focacce farcite', 'Parmigiana di melanzane', 'Tramezzini', 'Cicchetti veneziani', 'Bruschette']],
    ['Pasta', ['Lasagna', 'Pasta al pomodoro', 'Norma', 'Carbonara', 'Cacio e pepe', 'Pesto', 'Gorgonzola e speck', 'Bolognese', 'Amatriciana', 'Gnocchi alla sorrentina']],
    ['Pizza', ['Margherita', 'Marinara', 'Patate e rosmarino', 'Funghi e salsiccia', 'Burrata e prosciutto crudo', 'Stracciatella, mortadella e pistacchio', 'Zucchine', 'Melanzane']],
    ['Drinks', ['Spritz', 'Select', 'Limoncello', 'Fleur de sureau', 'Framboise', 'Mangue', 'Prosecco naturale de Valdobbiadene']],
    ['Dessert', ['Tiramisu', 'Biscuits faits maison', 'Sbriciolata', 'Mille-feuille', 'Cannoli siciliani']]
  ];

  // ==========================================================================
  //  Hover styling — replaces the design tool's `style-hover` attribute.
  //  We capture each element's base inline style once and append the hover
  //  declarations on enter / restore on leave.
  // ==========================================================================
  document.querySelectorAll('[data-hover]').forEach(function (el) {
    var hover = el.getAttribute('data-hover');
    var base = el.getAttribute('style') || '';
    el.addEventListener('mouseenter', function () { el.setAttribute('style', base + ';' + hover); });
    el.addEventListener('mouseleave', function () { el.setAttribute('style', base); });
  });

  // ==========================================================================
  //  Language toggle (FR default / EN)
  //  The French copy is the live text; each translatable node carries its
  //  English string in data-en. We stash the FR HTML in data-fr on first
  //  switch so we can swap back and forth without losing it.
  // ==========================================================================
  var isEnglish = false;
  function setLanguage(toEnglish) {
    isEnglish = !!toEnglish;
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (isEnglish) {
        if (el.getAttribute('data-fr') === null) el.setAttribute('data-fr', el.innerHTML);
        el.innerHTML = el.getAttribute('data-en');
      } else {
        var fr = el.getAttribute('data-fr');
        if (fr !== null) el.innerHTML = fr;
      }
    });
    document.documentElement.lang = isEnglish ? 'en' : 'fr';
    if (els.langBtn) {
      var en = els.langBtn.querySelector('[data-lang="en"]');
      var fr = els.langBtn.querySelector('[data-lang="fr"]');
      if (en && fr) {
        en.style.textDecoration = isEnglish ? 'underline' : 'none';
        fr.style.textDecoration = isEnglish ? 'none' : 'underline';
      }
    }
  }

  // ==========================================================================
  //  Full-screen overlay menu (hamburger)
  // ==========================================================================
  var menuOpen = false;
  function applyMenu() {
    if (els.menuBtn) els.menuBtn.classList.toggle('open', menuOpen);
    if (!els.menuOverlay) return;
    els.menuOverlay.style.opacity = menuOpen ? '1' : '0';
    els.menuOverlay.style.pointerEvents = menuOpen ? 'auto' : 'none';
  }

  // ==========================================================================
  //  Actions — replaces the design tool's onClick / onSubmit bindings.
  // ==========================================================================
  var actions = {
    toggleMenu: function () { menuOpen = !menuOpen; applyMenu(); },
    closeMenu: function () { menuOpen = false; applyMenu(); },
    langToggle: function () { setLanguage(!isEnglish); },
    toTop: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    goPhilo: function (e) {
      if (e) e.preventDefault();
      menuOpen = false; applyMenu();
      if (!els.revealSec) return;
      var y = els.revealSec.getBoundingClientRect().top + window.scrollY + window.innerHeight * 1.15;
      window.scrollTo({ top: y, behavior: 'smooth' });
    },
    onSubmit: function (e) {
      if (e) e.preventDefault();
      var form = e && e.target ? e.target : null;
      if (!form) return;
      var btn = form.querySelector('button[type=submit]');
      var endpoint = form.getAttribute('action') || '';
      var done = function () {
        if (!btn) return;
        btn.textContent = isEnglish ? 'Message sent' : 'Message envoyé';
        btn.style.background = '#DEA529';
        btn.style.color = '#3A3528';
      };
      var fail = function () {
        if (!btn) return;
        btn.disabled = false;
        btn.textContent = isEnglish ? 'Try again' : 'Réessayer';
      };
      // Not yet configured with a real Formspree form id → just confirm on the button.
      if (!endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1) { done(); return; }
      // Real submit: POST the fields to Formspree, stay on the page.
      if (btn) { btn.disabled = true; btn.textContent = isEnglish ? 'Sending…' : 'Envoi…'; }
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (r.ok) { done(); form.reset(); } else { fail(); } })
        .catch(fail);
    }
  };
  document.querySelectorAll('[data-action]').forEach(function (el) {
    var fn = actions[el.getAttribute('data-action')];
    if (!fn) return;
    el.addEventListener(el.tagName === 'FORM' ? 'submit' : 'click', fn);
  });
  // Footer language links set the language explicitly
  document.querySelectorAll('[data-lang-set]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      setLanguage(el.getAttribute('data-lang-set') === 'en');
    });
  });

  // ==========================================================================
  //  Scroll-reveal: fade/slide static-flow elements in as they enter view.
  //  (Scroll-scrubbed sections animate themselves, so we skip those.)
  // ==========================================================================
  var revealEls = [];
  [
    '#experiences-cards>div>h2', '#experiences-cards>div>p', '#experiences-cards .rm-exprow',
    '#contact h2', '#contact .rm-cintro', '#contact .rm-cform', 'footer>div:first-child'
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-reveal', ''); revealEls.push(el); });
  });
  var explistEl = document.querySelector('.rm-explist'); // has its own staggered li animation
  if (explistEl) revealEls.push(explistEl);
  if ('IntersectionObserver' in window) {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rm-in'); revIO.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('rm-in'); });
  }

  // ==========================================================================
  //  Menus — desktop list rendered per active category, mobile carousel.
  // ==========================================================================
  var currentCat = -1;
  function renderCategory(active) {
    if (!els.menuTitle || !els.menuList) return;
    var c = cats[active];
    els.menuTitle.textContent = c[0];
    // restart the title's entrance animation
    els.menuTitle.style.animation = 'none';
    void els.menuTitle.offsetWidth;
    els.menuTitle.style.animation = 'rmDishIn .5s cubic-bezier(.16,1,.3,1) both';
    els.menuList.innerHTML = c[1].map(function (dish, i) {
      var ld = (i * 0.06).toFixed(2);
      var td = (i * 0.06 + 0.14).toFixed(2);
      return '<div style="position:relative;height:clamp(32px,4.4vh,44px);display:flex;align-items:center;justify-content:center;">'
        + '<span style="position:absolute;left:0;right:0;bottom:0;height:1px;background:#1E194E;transform:scaleX(0);transform-origin:left;animation:rmLineDraw .6s cubic-bezier(.16,1,.3,1) ' + ld + 's both;"></span>'
        + '<span style="' + dishStyle + 'opacity:0;animation:rmDishIn .5s cubic-bezier(.16,1,.3,1) ' + td + 's both;">' + dish + '</span>'
        + '</div>';
    }).join('');
  }

  var mobileMenuBuilt = false;
  function buildMobileMenu() {
    if (mobileMenuBuilt || !els.menuMobile) return;
    mobileMenuBuilt = true;

    var cardsHtml = cats.map(function (c, ci) {
      var items = c[1].map(function (dish) {
        return '<div class="rm-mmitem" style="opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .55s cubic-bezier(.16,1,.3,1);display:flex;align-items:center;justify-content:center;padding:clamp(10px,1.4vh,14px) 0;border-bottom:1px solid #1E194E;"><span style="' + dishStyle + '">' + dish + '</span></div>';
      }).join('');
      return '<div class="rm-mmcard" style="display:' + (ci === 0 ? 'block' : 'none') + ';">'
        + '<div style="font-family:\'Rauschen\',sans-serif;font-weight:500;font-size:clamp(30px,7vw,42px);letter-spacing:0.07em;color:#1E194E;text-transform:uppercase;text-align:center;margin-bottom:14px;line-height:0.95;">' + c[0] + '</div>'
        + '<div style="border-top:1px solid #1E194E;">' + items + '</div></div>';
    }).join('');

    var dotsHtml = cats.map(function (c, ci) {
      return '<button class="rm-mmdot" data-i="' + ci + '" aria-label="' + c[0] + '" style="width:9px;height:9px;border-radius:50%;border:none;padding:0;cursor:pointer;background:' + (ci === 0 ? '#1E194E' : 'rgba(30,25,78,0.26)') + ';transition:background .3s ease,transform .3s ease;transform:scale(' + (ci === 0 ? '1.3' : '1') + ');"></button>';
    }).join('');

    els.menuMobile.innerHTML = '<div class="rm-mmstage" style="position:relative;width:100%;">' + cardsHtml + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;margin-top:22px;">' + dotsHtml + '</div>';

    var cards = els.menuMobile.querySelectorAll('.rm-mmcard');
    var dots = els.menuMobile.querySelectorAll('.rm-mmdot');
    var cur = 0;

    var reveal = function (card) {
      var its = card.querySelectorAll('.rm-mmitem');
      its.forEach(function (it) { it.style.transitionDelay = '0s'; it.style.opacity = '0'; it.style.transform = 'translateY(16px)'; });
      void card.offsetWidth;
      its.forEach(function (it, k) { it.style.transitionDelay = (0.04 + k * 0.07) + 's'; it.style.opacity = '1'; it.style.transform = 'none'; });
    };
    var hide = function (card) {
      card.querySelectorAll('.rm-mmitem').forEach(function (it) { it.style.transitionDelay = '0s'; it.style.opacity = '0'; it.style.transform = 'translateY(16px)'; });
    };
    var setActive = function (i) {
      if (i < 0) i = cats.length - 1;
      if (i >= cats.length) i = 0;
      cur = i;
      cards.forEach(function (el, k) { el.style.display = k === i ? 'block' : 'none'; if (k === i) reveal(el); else hide(el); });
      dots.forEach(function (el, k) { el.style.background = k === i ? '#1E194E' : 'rgba(30,25,78,0.26)'; el.style.transform = 'scale(' + (k === i ? '1.3' : '1') + ')'; });
    };

    dots.forEach(function (el) { el.addEventListener('click', function () { setActive(parseInt(el.dataset.i, 10)); }); });
    setTimeout(function () { reveal(cards[0]); }, 80);

    // Lock the stage to the tallest card so switching categories doesn't
    // jump the layout height (smoother carousel).
    var stage = els.menuMobile.querySelector('.rm-mmstage');
    var equalize = function () {
      var mh = 0;
      cards.forEach(function (c) { var d = c.style.display; c.style.display = 'block'; mh = Math.max(mh, c.offsetHeight); c.style.display = d; });
      stage.style.minHeight = mh + 'px';
    };
    equalize();
    setTimeout(equalize, 350);          // re-measure once fonts have settled
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalize);
    window.addEventListener('resize', equalize, { passive: true });

    // swipe support
    var sx = null;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) setActive(cur + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
  }

  var mq = window.matchMedia('(max-width:820px)');
  if (mq.matches) buildMobileMenu();
  mq.addEventListener('change', function (e) { if (e.matches) buildMobileMenu(); });

  // ==========================================================================
  //  Bottle experiences — scroll-icon click plays a staggered auto-reveal
  //  of the four labels (the hover reveal itself is pure CSS, `:has`).
  // ==========================================================================
  var botLabels = Array.prototype.slice.call(document.querySelectorAll('#experiences-cards .rm-botlabel'));
  var demoTimer;
  function playBottleDemo() {
    if (!botLabels.length) return;
    clearTimeout(demoTimer);
    var k = 0;
    var reset = function () { botLabels.forEach(function (l) { l.style.flexBasis = ''; l.style.opacity = ''; }); };
    var step = function () {
      reset();
      if (k >= botLabels.length) return;
      botLabels[k].style.flexBasis = 'clamp(190px,22vw,320px)';
      botLabels[k].style.opacity = '1';
      k++;
      demoTimer = setTimeout(step, 1150);
    };
    step();
  }
  document.querySelectorAll('#experiences-cards .rm-spark').forEach(function (el) {
    el.addEventListener('click', playBottleDemo);
  });

  // ==========================================================================
  //  Scroll engine — every scroll-scrubbed section is progressed here.
  //  Progress `p` for a pinned section = how far its top has scrolled past
  //  the viewport top, as a fraction of its total scroll distance.
  // ==========================================================================
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var checkgrids = Array.prototype.slice.call(document.querySelectorAll('.rm-debut'));
  var plates = Array.prototype.slice.call(document.querySelectorAll('.rm-plateinner'));
  var revCards = Array.prototype.slice.call(document.querySelectorAll('.rm-revcard'));
  var revDots = Array.prototype.slice.call(document.querySelectorAll('.rm-revdot'));
  var revwrap = document.querySelector('.rm-revwrap');
  var toTopBtn = document.querySelector('.rm-totop');
  var menuBtnShown = false, toTopShown = false, lastRevAct = -1, revMobile = false;

  // Menu button adapts its colour to the section it's currently over.
  // Each entry: {el, bg (button fill), fg (icon + border)} from the palette.
  var navThemes = [
    { el: document.getElementById('top'), bg: '#E5E1D6', fg: '#1C164F' },              // teal hero
    { el: document.getElementById('about'), bg: '#DEA529', fg: '#1C164F' },            // navy/beige philo
    { el: document.getElementById('experiences'), bg: '#DEA529', fg: '#1C164F' },      // navy cuisine
    { el: document.querySelector('.rm-debut'), bg: '#9D2D21', fg: '#E5E1D6' },         // cream / terracotta début
    { el: document.getElementById('experiences-cards'), bg: '#E5E1D6', fg: '#1C164F' },// teal experiences
    { el: document.getElementById('menus'), bg: '#E5E1D6', fg: '#1E194E' },            // navy panel / cream
    { el: document.getElementById('temoignages'), bg: '#DEA529', fg: '#66593C' },      // brown testimonials
    { el: document.getElementById('contact'), bg: '#9D2D21', fg: '#E5E1D6' },          // cream contact
    { el: document.querySelector('footer'), bg: '#E5E1D6', fg: '#9D2D21' }             // terracotta footer
  ].filter(function (t) { return t.el; });
  var currentNavTheme = -1;

  // Crossfade to a specific review (used by the mobile dot carousel)
  function setReview(i) {
    revCards.forEach(function (c, k) {
      if (!c.style.transition) c.style.transition = 'opacity .5s ease';
      c.style.opacity = k === i ? '1' : '0';
      c.style.transform = 'none';
      c.style.zIndex = k === i ? '2' : '1';
      c.classList.toggle('rm-on', k === i);
    });
    revDots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  // Lock the review wrapper to the tallest review so none is ever clipped
  function equalizeReviews() {
    if (!revwrap) return;
    var mh = 0;
    revCards.forEach(function (c) { mh = Math.max(mh, c.offsetHeight); });
    if (mh) revwrap.style.height = mh + 'px';
  }

  // Dots: on mobile switch reviews in place; on desktop scroll to that point
  revDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      if (revCards.length < 2) return;
      var i = parseInt(dot.dataset.i, 10);
      if (revMobile) { setReview(i); return; }
      if (!els.revSec) return;
      var top = els.revSec.getBoundingClientRect().top + window.scrollY;
      var dist = els.revSec.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + dist * (i / (revCards.length - 1)), behavior: 'smooth' });
    });
  });

  function enableMobileTestimonials() {
    if (revMobile) return;
    revMobile = true;
    equalizeReviews();
    setTimeout(equalizeReviews, 400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeReviews);
    window.addEventListener('resize', equalizeReviews, { passive: true });
    setReview(0);
  }
  var revMq = window.matchMedia('(max-width:820px)');
  if (revMq.matches) enableMobileTestimonials();
  revMq.addEventListener('change', function (e) { if (e.matches) enableMobileTestimonials(); });

  function onScroll() {
    var vh = window.innerHeight;

    // Parallax on the story photo + stickers
    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height / 2) - vh / 2;
      var sp = parseFloat(el.dataset.parallax) || 0;
      el.style.setProperty('--rm-py', (off * -sp).toFixed(1) + 'px');
    });

    // Hero logo fades once you leave the top
    if (els.heroLogo) els.heroLogo.style.setProperty('opacity', window.scrollY > 90 ? '0' : '1', 'important');

    // Maiolica cascade: arm the diagonal tile wave when the band nears view
    checkgrids.forEach(function (g) {
      if (!g.classList.contains('rm-in') && g.getBoundingClientRect().top < vh * 0.82) g.classList.add('rm-in');
    });

    // --- Experiences (pinned): plates rise + flip, headline lines wipe up ---
    if (els.expSec && els.expL1) {
      var er = els.expSec.getBoundingClientRect();
      var ed = er.height - vh;
      var ep = clamp01(ed > 0 ? (-er.top) / ed : 0);
      var seg = function (a, b) { return clamp01((ep - a) / (b - a)); };

      var pin = easeOutCubic(seg(0, 0.14));
      if (els.expPlates) {
        els.expPlates.style.opacity = pin.toFixed(3);
        els.expPlates.style.transform = 'translateY(' + ((1 - pin) * -56).toFixed(1) + 'px)';
      }
      var line = function (el, a, b) {
        var p = easeOutCubic(seg(a, b));
        el.style.transform = 'translateY(' + ((1 - p) * 110).toFixed(2) + '%)';
      };
      line(els.expL1, 0.14, 0.28);
      line(els.expL2, 0.30, 0.44);
      line(els.expL3, 0.46, 0.60);
      plates.forEach(function (pl, i) {
        var pt = easeOutCubic(clamp01((seg(0.50, 0.74) - i * 0.06) / 0.82));
        pl.style.transform = 'rotateY(' + (pt * 180).toFixed(1) + 'deg)';
      });
      var sp = easeOutCubic(seg(0.66, 0.80));
      if (els.expSub) {
        els.expSub.style.opacity = sp.toFixed(3);
        els.expSub.style.transform = 'translateY(' + ((1 - sp) * 18).toFixed(1) + 'px)';
      }
    }

    // --- Menus (pinned): scrub through the five categories ---
    if (els.menuSec && els.menuTitle) {
      var mr = els.menuSec.getBoundingClientRect();
      var md = mr.height - vh;
      var mp = clamp01(md > 0 ? (-mr.top) / md : 0);
      var active = Math.max(0, Math.min(cats.length - 1, Math.round(mp * (cats.length - 1))));
      if (active !== currentCat) { currentCat = active; renderCategory(active); }
    }

    // --- Testimonials (pinned): slide one review card in at a time ---
    if (els.revSec && revCards.length && !revMobile) {
      var rr = els.revSec.getBoundingClientRect();
      var rd = rr.height - vh;
      var rp = clamp01(rd > 0 ? (-rr.top) / rd : 0);
      var act = Math.round(rp * (revCards.length - 1));
      revCards.forEach(function (el, i) {
        if (!el.style.transition) el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        el.style.transform = 'translateX(' + ((i - act) * 100) + '%)';
        el.style.opacity = i === act ? '1' : '0';
        el.style.zIndex = String(10 + (i === act ? 1 : 0));
        el.classList.toggle('rm-on', i === act);
      });
      if (act !== lastRevAct) {
        lastRevAct = act;
        revDots.forEach(function (d, i) { d.classList.toggle('on', i === act); });
      }
    }

    // --- Philosophie (pinned): gallery parallax + beige panel slides up ---
    if (els.revealSec && els.philoPanel) {
      var pr = els.revealSec.getBoundingClientRect();
      var pd = pr.height - vh;
      var pp = clamp01(pd > 0 ? (-pr.top) / pd : 0);
      if (els.galColL) els.galColL.style.transform = 'translateY(' + (-pp * 140).toFixed(1) + 'px)';
      var start = 0.3, end = 0.8;
      var ty = Math.max(0, Math.min(100, (end - pp) / (end - start) * 100));
      els.philoPanel.style.transform = 'translateY(' + ty.toFixed(2) + '%)';
    }

    // --- Hamburger button reveals after the hero ---
    if (els.menuBtn) {
      var show = window.scrollY > 90;
      if (show !== menuBtnShown) {
        menuBtnShown = show;
        var st = els.menuBtn.style;
        st.opacity = show ? '1' : '0';
        st.pointerEvents = show ? 'auto' : 'none';
        st.transform = show ? 'none' : 'translateY(-8px)';
      }
      // Recolour to the section sitting under the button (top-right).
      // The hero is a sticky backdrop pinned at top:0, so skip it and let the
      // content scrolling over it win; fall back to the hero only at page top.
      if (navThemes.length) {
        var by = 44, pick = -1, pickTop = -1e9;
        for (var ti = 0; ti < navThemes.length; ti++) {
          if (navThemes[ti].el.id === 'top') continue;
          var tr = navThemes[ti].el.getBoundingClientRect();
          if (tr.top <= by && tr.bottom > by && tr.top > pickTop) { pickTop = tr.top; pick = ti; }
        }
        if (pick < 0) pick = 0; // still on the hero
        if (pick !== currentNavTheme) {
          currentNavTheme = pick;
          els.menuBtn.style.setProperty('--mb-bg', navThemes[pick].bg);
          els.menuBtn.style.setProperty('--mb-fg', navThemes[pick].fg);
        }
      }
    }

    // --- Back-to-top appears once you're well down the page ---
    if (toTopBtn) {
      var showTop = window.scrollY > vh * 1.4;
      if (showTop !== toTopShown) {
        toTopShown = showTop;
        toTopBtn.classList.toggle('show', showTop);
      }
    }
  }

  // rAF-throttled scroll so we do at most one layout pass per frame
  var ticking = false;
  function onScrollThrottled() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }
  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
})();
