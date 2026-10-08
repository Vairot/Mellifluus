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
    <p>Wir verwenden technisch notwendige Funktionen sowie – nur mit Ihrer Zustimmung – Google Maps und ein datenschutzfreundliches Analyse-Tool. Details in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
    <div class="cookie-banner-buttons">
      <button type="button" class="btn btn-ghost" id="cookieRejectBtn">Nur essenzielle</button>
      <button type="button" class="btn btn-dark" id="cookieAcceptBtn">Alle akzeptieren</button>
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
// Behaviour knobs live here; layout knobs (card size, gap, poster ratio) live
// in css/style.css under "Monatsspecial". Posters sit side by side while they
// fit — all of them on desktop, two per view on tablets, one on phones. Once
// there are more than that, the row turns into a swipeable, autoplaying
// carousel with dots.
const MONATSSPECIAL_CONFIG = {
  dataUrl: 'data/monatsspecial.json',
  autoplayMs: 5000,
  resumeAfterInteractionMs: 9000,
};
// Must match the .special-card breakpoints in css/style.css
const SPECIAL_ONE_PER_VIEW = '(max-width: 639px)';
const SPECIAL_TWO_PER_VIEW = '(max-width: 1023px)';

const initMonatsspecial = () => {
  const section = document.getElementById('monatsspecial');
  if (!section) return;

  const track = section.querySelector('.special-track');
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

      const captionFor = (s) => {
        const fmt = (iso) => {
          const [y, m, d] = String(iso).split('-');
          return d && m && y ? `${d}.${m}.${y}` : '';
        };
        if (s.end && fmt(s.end)) return `Nur bis ${fmt(s.end)}`;
        if (s.start && fmt(s.start)) return `Ab ${fmt(s.start)}`;
        return '';
      };

      track.replaceChildren(...specials.map((s, i) => {
        const li = document.createElement('li');
        li.className = 'special-card';
        li.setAttribute('role', 'group');
        li.setAttribute('aria-roledescription', 'Monatsspecial');
        li.setAttribute('aria-label', `${i + 1} von ${specials.length}`);

        const img = document.createElement('img');
        img.className = 'special-card-photo';
        img.src = s.poster;
        img.alt = s.alt || 'Monatsspecial';
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        li.appendChild(img);

        const caption = document.createElement('p');
        caption.className = 'special-card-caption';
        caption.textContent = captionFor(s);
        li.appendChild(caption);

        return li;
      }));

      section.hidden = false;
      if (navLink) navLink.hidden = false;

      const cards = Array.from(track.children);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const onePerView = window.matchMedia(SPECIAL_ONE_PER_VIEW);
      const twoPerView = window.matchMedia(SPECIAL_TWO_PER_VIEW);

      let index = 0;
      let pages = 0; // 0 = every poster fits, no carousel
      let dots = [];

      const paint = () => dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
        if (i === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      const goTo = (i, smooth = true) => {
        if (!pages) return;
        index = (i + pages) % pages;
        track.scrollTo({
          left: cards[index].offsetLeft - cards[0].offsetLeft,
          behavior: smooth && !reduceMotion ? 'smooth' : 'auto',
        });
        paint();
      };

      // ---- autoplay ----
      let timer = 0;
      let resumeTimer = 0;
      const play = () => {
        if (reduceMotion || timer || !pages) return;
        timer = window.setInterval(() => goTo(index + 1), MONATSSPECIAL_CONFIG.autoplayMs);
      };
      const stop = () => { window.clearInterval(timer); timer = 0; };
      const nudge = () => {
        stop();
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(play, MONATSSPECIAL_CONFIG.resumeAfterInteractionMs);
      };

      // Re-run whenever the viewport crosses one of the per-view breakpoints
      const layout = () => {
        const perView = onePerView.matches ? 1 : twoPerView.matches ? 2 : cards.length;
        pages = cards.length > perView ? cards.length - perView + 1 : 0;
        track.classList.toggle('is-carousel', pages > 0);
        dotsWrap.hidden = pages === 0;
        stop();

        dots = Array.from({ length: pages }, (_, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'special-dot';
          b.setAttribute('aria-label', `Special ${i + 1} anzeigen`);
          b.addEventListener('click', () => { goTo(i); nudge(); });
          return b;
        });
        dotsWrap.replaceChildren(...dots);

        index = Math.min(index, Math.max(pages - 1, 0));
        if (pages) goTo(index, false);
        else track.scrollLeft = 0;
        play();
      };

      // Keep the active dot in sync when the visitor scrolls / swipes by hand
      let raf = 0;
      track.addEventListener('scroll', () => {
        if (!pages) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const step = cards[1].offsetLeft - cards[0].offsetLeft;
          const nearest = Math.min(pages - 1, Math.max(0, Math.round(track.scrollLeft / step)));
          if (nearest !== index) { index = nearest; paint(); }
        });
      }, { passive: true });

      // Drag-to-scroll for mouse users (touch scrolls natively)
      let dragging = false;
      let dragStartX = 0;
      let dragStartScroll = 0;
      track.addEventListener('pointerdown', (e) => {
        if (!pages || e.pointerType === 'touch') return;
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

      section.addEventListener('mouseenter', stop);
      section.addEventListener('mouseleave', play);
      section.addEventListener('focusin', stop);
      section.addEventListener('focusout', play);
      track.addEventListener('touchstart', nudge, { passive: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });

      onePerView.addEventListener('change', layout);
      twoPerView.addEventListener('change', layout);
      layout();
    })
    .catch(keepHidden);
};

document.addEventListener('DOMContentLoaded', () => {
  initMonatsspecial();

  // Mobile nav toggle (not present on danke.html)
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    const closeNav = () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    };

    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

    // The drawer only exists below 860px (see css/style.css) — don't leave it
    // open in the background when the window is widened past that.
    window.matchMedia('(min-width: 860px)').addEventListener('change', closeNav);
  }

  // Menu tabs + phone accordion. Below 640px each menu group collapses to its
  // heading and only one is open at a time (the first one by default) — the
  // breakpoint matches the .menu-accordion styles in css/style.css.
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  const menuSection = document.getElementById('speisekarte');
  const accordionMq = window.matchMedia('(max-width: 639px)');

  const syncGroupA11y = (group) => {
    const title = group.querySelector('.menu-group-title');
    if (accordionMq.matches) {
      title.setAttribute('role', 'button');
      title.tabIndex = 0;
      title.setAttribute('aria-expanded', String(group.classList.contains('is-open')));
    } else {
      title.removeAttribute('role');
      title.removeAttribute('tabindex');
      title.removeAttribute('aria-expanded');
    }
  };
  const setGroupOpen = (group, open) => {
    group.classList.toggle('is-open', open);
    syncGroupA11y(group);
  };
  const openFirstGroup = (panel) => {
    panel.querySelectorAll('.menu-group').forEach((g, i) => setGroupOpen(g, i === 0));
  };

  if (menuSection) {
    menuSection.querySelectorAll('.menu-group').forEach(group => {
      const title = group.querySelector('.menu-group-title');
      const chevron = document.createElement('span');
      chevron.className = 'menu-group-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      title.appendChild(chevron);

      const toggle = () => {
        if (!accordionMq.matches) return;
        const wasOpen = group.classList.contains('is-open');
        group.closest('.menu-panel').querySelectorAll('.menu-group').forEach(g => setGroupOpen(g, false));
        if (wasOpen) return;
        setGroupOpen(group, true);
        // Collapsing a longer group above can push this heading up under the
        // sticky header (72px) — scroll it back into view.
        const top = title.getBoundingClientRect().top;
        if (top < 80) window.scrollBy({ top: top - 84, behavior: 'smooth' });
      };
      title.addEventListener('click', toggle);
      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    panels.forEach(openFirstGroup);
    menuSection.classList.add('menu-accordion');
    accordionMq.addEventListener('change', () => {
      menuSection.querySelectorAll('.menu-group').forEach(syncGroupA11y);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(tab.dataset.target);
      panel.classList.add('active');
      openFirstGroup(panel);
    });
  });

  // Opening hours: highlight today's row (the list starts on Monday)
  const hoursList = document.getElementById('hoursList');
  if (hoursList) {
    const row = hoursList.children[(new Date().getDay() + 6) % 7];
    if (row) {
      row.classList.add('is-today');
      const badge = document.createElement('span');
      badge.className = 'hours-today';
      badge.textContent = 'Heute';
      row.querySelector('.hours-day').after(badge);
    }
  }

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
  // less than two hours from now (the kitchen needs at least that much notice).
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const minTimeForDate = (dateStr) => {
    if (dateStr !== todayStr()) return '09:00';
    const min = new Date(Date.now() + 2 * 60 * 60 * 1000);
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
        ? 'Bitte wählen Sie eine Uhrzeit mindestens zwei Stunden im Voraus.'
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

  // Telefon: digits only, plus an optional leading "+" (international numbers)
  // and spaces for readability. Anything else is dropped as it's typed or pasted.
  const phoneInput = document.getElementById('phone');
  const MIN_PHONE_DIGITS = 6;
  const validatePhone = () => {
    if (!phoneInput) return;
    const digits = phoneInput.value.replace(/\D/g, '').length;
    phoneInput.setCustomValidity(phoneInput.value && digits < MIN_PHONE_DIGITS
      ? 'Bitte geben Sie eine gültige Telefonnummer ein.'
      : '');
  };
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const raw = phoneInput.value;
      const clean = raw.replace(/[^\d+ ]/g, '').replace(/(?!^)\+/g, '').replace(/ {2,}/g, ' ');
      if (clean !== raw) {
        const caret = Math.max(0, (phoneInput.selectionStart ?? raw.length) - (raw.length - clean.length));
        phoneInput.value = clean;
        phoneInput.setSelectionRange(caret, caret);
      }
      validatePhone();
    });
  }

  // Party size stepper (1 … 8+) feeding the hidden "Personen" field, which
  // sends "1" … "7" or "8+".
  const guestsInput = document.getElementById('guests');
  const guestsValue = document.getElementById('guestsValue');
  const guestsDec = document.getElementById('guestsDec');
  const guestsInc = document.getElementById('guestsInc');
  if (guestsInput && guestsValue && guestsDec && guestsInc) {
    const MAX_GUESTS = 8;
    let guests = Math.min(MAX_GUESTS, Math.max(1, parseInt(guestsInput.value, 10) || 2));
    const renderGuests = () => {
      guestsValue.textContent = guests >= MAX_GUESTS ? `${MAX_GUESTS}+ Personen` : guests === 1 ? '1 Person' : `${guests} Personen`;
      guestsInput.value = guests >= MAX_GUESTS ? `${MAX_GUESTS}+` : String(guests);
      // aria-disabled rather than disabled, so keyboard focus isn't dropped at the limits
      guestsDec.setAttribute('aria-disabled', String(guests <= 1));
      guestsInc.setAttribute('aria-disabled', String(guests >= MAX_GUESTS));
    };
    guestsDec.addEventListener('click', () => { guests = Math.max(1, guests - 1); renderGuests(); });
    guestsInc.addEventListener('click', () => { guests = Math.min(MAX_GUESTS, guests + 1); renderGuests(); });
    renderGuests();
  }

  if (reservationForm) {
    reservationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      validateDate();
      validateTime();
      validatePhone();
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
