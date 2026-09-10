import { injectSpeedInsights } from '@vercel/speed-insights';

// Cookie consent: Google Maps and Vercel Analytics/Speed Insights are only
// loaded once the visitor accepts them via the cookie banner (or clicks the
// map's own "load" placeholder) — see datenschutz.html for what each does.
const CONSENT_KEY = 'mellifluus-consent';
const MAPS_EMBED_SRC = 'https://www.google.com/maps?q=Kampstra%C3%9Fe+7,+32423+Minden&output=embed';

const getConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
};

const setConsent = (value) => {
  try { localStorage.setItem(CONSENT_KEY, value); } catch {}
};

let analyticsLoaded = false;
const loadAnalytics = () => {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);

  injectSpeedInsights();
};

const loadMapEmbed = (container) => {
  if (!container || container.dataset.loaded === 'true') return;
  container.dataset.loaded = 'true';
  const iframe = document.createElement('iframe');
  iframe.title = 'Mellifluus auf Google Maps';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.src = MAPS_EMBED_SRC;
  container.replaceChildren(iframe);
};

const applyConsent = (value) => {
  if (value !== 'all') return;
  loadAnalytics();
  loadMapEmbed(document.getElementById('locationMap'));
};

const showConsentBanner = () => {
  if (document.getElementById('cookieBanner')) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookieBanner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie-Einstellungen');
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <p>Wir verwenden technisch notwendige Funktionen sowie – nur mit Ihrer Zustimmung – Google Maps und ein datenschutzfreundliches Analyse-Tool. Details in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
      <div class="cookie-banner-buttons">
        <button type="button" class="btn btn-outline" id="cookieRejectBtn">Nur essenzielle</button>
        <button type="button" class="btn btn-primary" id="cookieAcceptBtn">Alle akzeptieren</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookieAcceptBtn').addEventListener('click', () => {
    setConsent('all');
    applyConsent('all');
    banner.remove();
  });
  document.getElementById('cookieRejectBtn').addEventListener('click', () => {
    setConsent('essential');
    banner.remove();
  });
};

// --- Monatsspecial carousel ------------------------------------------------
// Behaviour knobs live here; layout knobs (card width, poster ratio, gap) live
// in css/style.css under ".special-carousel". autoplayMinCount: autoplay only
// kicks in from this many posters up — with fewer, they just sit centred.
const MONATSSPECIAL_CONFIG = {
  dataUrl: 'data/monatsspecial.json',
  autoplayMs: 5000,
  autoplayMinCount: 3,
  resumeAfterInteractionMs: 9000,
};

const initMonatsspecial = () => {
  const section = document.getElementById('monatsspecial');
  if (!section) return;

  const track = section.querySelector('.special-track');
  const prevBtn = section.querySelector('.special-arrow-prev');
  const nextBtn = section.querySelector('.special-arrow-next');
  const dotsWrap = section.querySelector('.special-dots');
  const navLink = document.querySelector('.main-nav a[href="#monatsspecial"]');
  const keepHidden = () => { section.hidden = true; if (navLink) navLink.hidden = true; };

  fetch(MONATSSPECIAL_CONFIG.dataUrl, { cache: 'no-cache' })
    .then(res => (res.ok ? res.json() : Promise.reject(new Error('no data'))))
    .then(data => {
      const today = new Date().toISOString().slice(0, 10);
      const specials = (data && Array.isArray(data.specials) ? data.specials : []).filter(s => {
        if (!s || !s.poster) return false;
        if (s.start && s.start > today) return false; // not started yet
        if (s.end && s.end < today) return false;     // already expired
        return true;
      });

      if (specials.length === 0) { keepHidden(); return; }

      track.replaceChildren(...specials.map((s, i) => {
        const li = document.createElement('li');
        li.className = 'special-card';
        li.setAttribute('role', 'group');
        li.setAttribute('aria-roledescription', 'Monatsspecial');
        li.setAttribute('aria-label', `${i + 1} von ${specials.length}`);
        const img = document.createElement('img');
        img.src = s.poster;
        img.alt = s.alt || 'Monatsspecial';
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        li.appendChild(img);
        return li;
      }));

      section.hidden = false;
      if (navLink) navLink.hidden = false;

      const cards = Array.from(track.children);
      if (cards.length < MONATSSPECIAL_CONFIG.autoplayMinCount) return; // 1–2 posters: static

      // ---- carousel mode (3+ posters) ----
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.classList.add('is-carousel');
      prevBtn.hidden = false;
      nextBtn.hidden = false;
      dotsWrap.hidden = false;

      let index = 0;
      const paint = () => dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
        if (i === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      const goTo = (i) => {
        index = (i + cards.length) % cards.length;
        const card = cards[index];
        const delta = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
        const target = track.scrollLeft + delta - (track.clientWidth - card.offsetWidth) / 2;
        track.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
        paint();
      };

      const dots = cards.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'special-dot';
        b.setAttribute('aria-label', `Special ${i + 1} anzeigen`);
        b.addEventListener('click', () => { goTo(i); nudge(); });
        dotsWrap.appendChild(b);
        return b;
      });

      prevBtn.addEventListener('click', () => { goTo(index - 1); nudge(); });
      nextBtn.addEventListener('click', () => { goTo(index + 1); nudge(); });

      // Keep the active dot in sync when the visitor scrolls / swipes by hand
      let raf = 0;
      track.addEventListener('scroll', () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
          let nearest = 0;
          let best = Infinity;
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - mid);
            if (dist < best) { best = dist; nearest = i; }
          });
          if (nearest !== index) { index = nearest; paint(); }
        });
      }, { passive: true });

      // Drag-to-scroll for mouse users (touch scrolls natively)
      let dragging = false;
      let dragStartX = 0;
      let dragStartScroll = 0;
      track.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        dragging = true;
        dragStartX = e.clientX;
        dragStartScroll = track.scrollLeft;
        track.setPointerCapture(e.pointerId);
      });
      track.addEventListener('pointermove', (e) => {
        if (dragging) track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
      });
      const endDrag = () => { if (dragging) { dragging = false; nudge(); } };
      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);

      // ---- autoplay ----
      let timer = 0;
      let resumeTimer = 0;
      const play = () => {
        if (reduceMotion || timer) return;
        timer = window.setInterval(() => goTo(index + 1), MONATSSPECIAL_CONFIG.autoplayMs);
      };
      const stop = () => { window.clearInterval(timer); timer = 0; };
      const nudge = () => {
        stop();
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(play, MONATSSPECIAL_CONFIG.resumeAfterInteractionMs);
      };

      section.addEventListener('mouseenter', stop);
      section.addEventListener('mouseleave', play);
      section.addEventListener('focusin', stop);
      section.addEventListener('focusout', play);
      track.addEventListener('touchstart', nudge, { passive: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });

      paint();
      play();
    })
    .catch(keepHidden);
};

document.addEventListener('DOMContentLoaded', () => {
  initMonatsspecial();

  // Mobile nav toggle (not present on danke.html)
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // Menu tabs
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  // Hero background video: some mobile browsers (notably iOS Safari) silently
  // pause the video under memory/power pressure or after the tab is backgrounded,
  // and don't resume it on their own even with autoplay/loop — it just freezes
  // on whatever frame it stopped at. Nudge it back to playing whenever that happens.
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.muted = true;

    const resumeHeroVideo = () => {
      if (document.visibilityState === 'visible' && heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }
    };

    heroVideo.addEventListener('pause', resumeHeroVideo);
    heroVideo.addEventListener('stalled', resumeHeroVideo);
    heroVideo.addEventListener('suspend', resumeHeroVideo);
    document.addEventListener('visibilitychange', resumeHeroVideo);
    window.addEventListener('pageshow', resumeHeroVideo);
  }

  // Footer year (not present on danke.html)
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Cookie consent: apply a stored choice, otherwise ask
  const existingConsent = getConsent();
  if (existingConsent === 'all') {
    applyConsent('all');
  } else if (existingConsent !== 'essential') {
    showConsentBanner();
  }

  // Google Maps placeholder (index.html only): load on demand regardless of
  // the general banner choice — clicking it is its own specific consent.
  const loadMapBtn = document.getElementById('loadMapBtn');
  if (loadMapBtn) {
    loadMapBtn.addEventListener('click', () => {
      loadMapEmbed(document.getElementById('locationMap'));
    });
  }

  // Footer link to reopen the cookie banner and change consent later
  const cookieSettingsBtn = document.getElementById('cookieSettingsBtn');
  if (cookieSettingsBtn) {
    cookieSettingsBtn.addEventListener('click', () => {
      document.getElementById('cookieBanner')?.remove();
      showConsentBanner();
    });
  }

  // Submit the reservation via FormSubmit's AJAX endpoint instead of a plain
  // HTML form POST. The plain POST relies on FormSubmit's server issuing an
  // HTTP redirect to _next, which some local dev servers (e.g. WebStorm's
  // built-in server) don't follow correctly. Submitting via fetch and doing
  // the redirect to danke.html ourselves keeps that navigation same-origin,
  // so it works the same everywhere.
  const reservationForm = document.getElementById('reservationForm');
  const formStatus = document.getElementById('formStatus');

  // Reservation date & time: block Tuesdays, past dates, and same-day times
  // less than one hour from now (the kitchen needs at least that much notice).
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const minTimeForDate = (dateStr) => {
    if (dateStr !== todayStr()) return '09:00';
    const min = new Date(Date.now() + 60 * 60 * 1000);
    const hhmm = `${pad(min.getHours())}:${pad(min.getMinutes())}`;
    return hhmm > '09:00' ? hhmm : '09:00';
  };
  const validateDate = () => {
    if (!dateInput || !dateInput.value) return;
    const day = new Date(dateInput.value + 'T00:00:00').getDay();
    if (day === 2) {
      dateInput.setCustomValidity('Dienstags ist Ruhetag. Bitte wählen Sie einen anderen Tag.');
    } else {
      dateInput.setCustomValidity('');
    }
  };
  const validateTime = () => {
    if (!dateInput || !timeInput) return;
    const minTime = minTimeForDate(dateInput.value);
    timeInput.setAttribute('min', minTime);
    if (!timeInput.value) { timeInput.setCustomValidity(''); return; }
    if (timeInput.value < minTime) {
      timeInput.setCustomValidity(dateInput.value === todayStr()
        ? 'Bitte wählen Sie eine Uhrzeit mindestens eine Stunde im Voraus.'
        : 'Bitte wählen Sie eine Uhrzeit ab 09:00 Uhr.');
    } else if (timeInput.value > '19:00') {
      timeInput.setCustomValidity('Bitte wählen Sie eine Uhrzeit bis 19:00 Uhr.');
    } else {
      timeInput.setCustomValidity('');
    }
  };

  if (dateInput) {
    dateInput.setAttribute('min', todayStr());
    dateInput.addEventListener('input', () => {
      validateDate();
      validateTime();
      dateInput.reportValidity();
    });
  }
  if (timeInput) {
    timeInput.addEventListener('input', () => {
      validateTime();
      timeInput.reportValidity();
    });
  }

  if (reservationForm) {
    reservationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      validateDate();
      validateTime();
      if (!reservationForm.checkValidity()) {
        reservationForm.reportValidity();
        return;
      }

      const submitButton = reservationForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      formStatus.textContent = 'Wird gesendet ...';

      const payload = {};
      new FormData(reservationForm).forEach((value, key) => { payload[key] = value; });

      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(reservationForm.action.split('/').pop())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(response => {
          if (!response.ok) throw new Error('Request failed');
          window.location.href = new URL('danke.html', window.location.href).href;
        })
        .catch(() => {
          submitButton.disabled = false;
          formStatus.textContent = 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie uns an.';
        });
    });
  }
});
