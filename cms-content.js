/* ── CMS content bridge ───────────────────────────────────────────────────────
   Reads the editable data files (what the client changes in /admin) and writes
   the values into the page, THEN starts the site's main script.

   Why load script.js from here? The menus, testimonials and gallery are built
   and animated by script.js. It has to see the client's content already in the
   page — so we put the content in first, then start the app. "Data first, then
   app." That's the whole reason for the ordering.

   Safety: every section is wrapped in try/catch, and script.js is ALWAYS loaded
   at the end (finally). If a data file is missing, unreachable or malformed, the
   page simply keeps its original hard-coded content. The CMS can never take the
   live site down.
──────────────────────────────────────────────────────────────────────────────*/
(function () {
  'use strict';

  // Small helper: fetch JSON, but never throw — return null on any problem so a
  // single missing file can't stop everything else.
  function loadJSON(path) {
    return fetch(path, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Escape text before putting it in innerHTML (the content is the client's own,
  // but this keeps a stray < or & from breaking the markup).
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Load script.js exactly the way the page used to — kept in one place so it
  // always runs, whatever happened above.
  function startApp() {
    var s = document.createElement('script');
    s.src = 'script.js?v=18';
    document.body.appendChild(s);
  }

  // ── the five stars shown on every testimonial card ────────────────────────
  function stars() {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += '<svg class="rm-star" width="12" height="12" viewBox="0 0 24 24" style="display:block;animation-delay:' +
        (i * 0.06) + 's;"><path d="M12 0C13.2 8 16 10.8 24 12C16 13.2 13.2 16 12 24C10.8 16 8 13.2 0 12C8 10.8 10.8 8 12 0Z" fill="#E5E1D6"></path></svg>';
    }
    return out;
  }

  Promise.all([
    loadJSON('content/site.json'),
    loadJSON('content/menus.json'),
    loadJSON('content/testimonials.json'),
    loadJSON('content/gallery.json')
  ]).then(function (res) {
    var site = res[0], menus = res[1], testimonials = res[2], gallery = res[3];

    // 1 ─ Homepage text & contact links ---------------------------------------
    try {
      if (site) {
        // Bilingual text: French is the visible content, English goes on data-en,
        // so the site's existing FR/EN toggle keeps working untouched.
        document.querySelectorAll('[data-cms-text]').forEach(function (el) {
          var val = site[el.getAttribute('data-cms-text')];
          if (!val) return;
          el.innerHTML = esc(val.fr);
          if (val.en) el.setAttribute('data-en', val.en);
        });
        // Links: one editable value drives the href.
        document.querySelectorAll('[data-cms-link]').forEach(function (el) {
          var key = el.getAttribute('data-cms-link'), val = site[key];
          if (!val) return;
          if (key === 'email')      el.setAttribute('href', 'mailto:' + val);
          else if (key === 'phone') el.setAttribute('href', 'tel:' + String(val).replace(/\s+/g, ''));
          else                      el.setAttribute('href', val);
        });
      }
    } catch (e) { /* keep original homepage text */ }

    // 2 ─ Menus ---------------------------------------------------------------
    // script.js reads window.RM_CATS if we set it; otherwise it uses its own
    // built-in list. We convert {categories:[{category,dishes}]} into the
    // [name, [dishes]] shape script.js expects.
    try {
      if (menus && Array.isArray(menus.categories) && menus.categories.length) {
        window.RM_CATS = menus.categories.map(function (c) {
          return [c.category, Array.isArray(c.dishes) ? c.dishes : []];
        });
      }
    } catch (e) { /* script.js falls back to its built-in menu */ }

    // 3 ─ Testimonials --------------------------------------------------------
    // Rebuild the review cards + the dots from the data, BEFORE script.js grabs
    // them for the slider. Only touch the DOM if we actually have data.
    try {
      var wrap = document.querySelector('.rm-revwrap');
      var dots = document.querySelector('.rm-revdots');
      if (wrap && testimonials && Array.isArray(testimonials.items) && testimonials.items.length) {
        wrap.innerHTML = testimonials.items.map(function (t, i) {
          var paras = String(t.quote || '').split(/\n\s*\n/).map(function (p) {
            return '<p style="margin:0;">' + esc(p.trim()) + '</p>';
          }).join('');
          return '<div class="rm-revcard" style="position:absolute;left:0;right:0;top:0;opacity:' + (i === 0 ? '1' : '0') + ';">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:\'Rauschen\',sans-serif;font-weight:400;font-size:15px;line-height:0.97;letter-spacing:0.07em;text-transform:uppercase;color:#E5E1D6;margin-bottom:clamp(16px,2.4vh,26px);">' +
                '<span style="display:flex;align-items:center;gap:10px;">' + esc(t.rating || '5/5') + ' <span style="display:inline-flex;gap:5px;align-items:center;">' + stars() + '</span></span>' +
                '<span>' + esc(t.date || '') + '</span>' +
                '<span>' + esc(t.name || '') + '</span>' +
              '</div>' +
              '<div style="font-family:\'TimezoneMono\',monospace;font-weight:400;font-size:15px;line-height:1.14;letter-spacing:0.06em;color:#E5E1D6;display:flex;flex-direction:column;gap:clamp(8px,1.2vh,14px);">' + paras + '</div>' +
            '</div>';
        }).join('');

        if (dots) {
          dots.innerHTML = testimonials.items.map(function (t, i) {
            return '<button class="rm-revdot' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" aria-label="Avis ' + (i + 1) + '"></button>';
          }).join('');
        }
      }
    } catch (e) { /* keep the original testimonial cards */ }

    // 4 ─ Gallery band --------------------------------------------------------
    // Replace the photos in the scrolling band. We output the list twice so the
    // marquee's seamless -50% loop still lines up.
    try {
      var track = document.querySelector('.rm-galmarquee .rm-marquee-track');
      if (track && gallery && Array.isArray(gallery.images) && gallery.images.length) {
        var half = gallery.images.map(function (src) {
          return '<img src="' + esc(src) + '" alt="">';
        }).join('');
        track.innerHTML = half + half;
      }
    } catch (e) { /* keep the original gallery photos */ }

  }).catch(function () {
    /* whole load failed → page keeps every original value */
  }).then(startApp, startApp);   // ALWAYS start the app, success or failure
})();
