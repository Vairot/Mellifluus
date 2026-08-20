// Import and initialize Vercel Speed Insights
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights();

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

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

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Plain HTML form POST to FormSubmit (not AJAX): FormSubmit's autoresponse
  // email to the guest only fires on a standard POST with reCAPTCHA enabled —
  // it's documented to silently not send on AJAX submissions or with
  // _captcha=false. _next needs an absolute URL since the redirect back to
  // danke.html is issued by formsubmit.co, a different origin.
  const reservationForm = document.getElementById('reservationForm');
  const nextField = document.getElementById('nextField');
  const autoresponseField = document.getElementById('autoresponseField');
  const dateFieldEl = document.getElementById('date');
  const timeFieldEl = document.getElementById('time');

  if (nextField) {
    nextField.value = new URL('danke.html', window.location.href).href;
  }

  if (reservationForm && autoresponseField) {
    reservationForm.addEventListener('submit', () => {
      const formattedDate = dateFieldEl && dateFieldEl.value
        ? new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
            .format(new Date(`${dateFieldEl.value}T00:00:00`))
        : dateFieldEl.value;
      const formattedTime = timeFieldEl ? timeFieldEl.value : '';

      autoresponseField.value = autoresponseField.value
        .replace('{DATUM}', formattedDate)
        .replace('{UHRZEIT}', formattedTime);
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
