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
