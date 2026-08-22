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

document.addEventListener('DOMContentLoaded', () => {
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
  if (reservationForm) {
    reservationForm.addEventListener('submit', (event) => {
      event.preventDefault();
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

  // Reservation date: block Tuesdays, don't allow past dates
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    dateInput.addEventListener('input', () => {
      const day = new Date(dateInput.value + 'T00:00:00').getDay();
      if (day === 2) {
        dateInput.setCustomValidity('Dienstags ist Ruhetag. Bitte wählen Sie einen anderen Tag.');
      } else {
        dateInput.setCustomValidity('');
      }
      dateInput.reportValidity();
    });
  }
});
