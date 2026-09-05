/* =====================================================
   BIRTHDAY WEBSITE — script.js
   "Then & Now" Long-Distance Birthday Website
   ===================================================== */

'use strict';

// ═══════════════════════════════════════════════════
//  1.  FLOATING PETALS (Hero Section)
// ═══════════════════════════════════════════════════

(function initPetals() {
  const container  = document.getElementById('petalsContainer');
  const EMOJIS     = ['✨', '🎉', '⭐', '🌸', '🎈', '🎊', '💫', '🎂'];
  const TOTAL      = 22;
  const MIN_DUR    = 7;   // seconds
  const MAX_DUR    = 14;

  function spawnPetal() {
    const el = document.createElement('span');
    el.classList.add('petal');
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    el.setAttribute('aria-hidden', 'true');

    // Random horizontal start
    el.style.left            = Math.random() * 100 + 'vw';
    el.style.fontSize        = (13 + Math.random() * 18) + 'px';
    el.style.animationDuration  = (MIN_DUR + Math.random() * (MAX_DUR - MIN_DUR)).toFixed(2) + 's';
    el.style.animationDelay     = (Math.random() * 4).toFixed(2) + 's';

    container.appendChild(el);

    // Remove and recycle after one cycle
    el.addEventListener('animationend', function recycle() {
      el.remove();
      spawnPetal();
    }, { once: true });
  }

  // Stagger initial spawn to avoid a "wave" on load
  for (let i = 0; i < TOTAL; i++) {
    setTimeout(spawnPetal, i * 250);
  }
}());


// ═══════════════════════════════════════════════════
//  2.  CAROUSEL
// ═══════════════════════════════════════════════════

/**
 * Builds a fully functional carousel with:
 *  - Prev / Next buttons
 *  - Dot indicators
 *  - Touch/pointer swipe (mobile + desktop drag)
 *  - Auto-play (pauses on hover/focus)
 *
 * @param {string} prefix   - 'then' | 'now'
 * @param {number} count    - total number of slides
 */
function createCarousel(prefix, count) {
  const track         = document.getElementById(prefix + 'Track');
  const trackContainer = document.getElementById(prefix + 'TrackContainer');
  const prevBtn       = document.getElementById(prefix + 'Prev');
  const nextBtn       = document.getElementById(prefix + 'Next');
  const dotsWrapper   = document.getElementById(prefix + 'Dots');
  const dots          = Array.from(dotsWrapper.querySelectorAll('.dot'));

  if (!track || !trackContainer || !prevBtn || !nextBtn || dots.length === 0) {
    console.warn('[Carousel] Missing DOM elements for prefix:', prefix);
    return;
  }

  let current    = 0;
  let isAnimating = false;
  let autoTimer  = null;

  // ── Core navigation ──────────────────────────
  function goTo(index) {
    if (isAnimating) return;

    // Wrap around
    const next = ((index % count) + count) % count;
    if (next === current && track.style.transform) return; // already there

    isAnimating = true;
    current = next;

    track.style.transform = `translateX(-${current * 100}%)`;

    // Update dots
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
    });

    // Unlock after CSS transition (0.45 s + small buffer)
    setTimeout(() => { isAnimating = false; }, 480);
  }

  // ── Button handlers ───────────────────────────
  prevBtn.addEventListener('click', () => {
    goTo(current - 1);
    resetAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    goTo(current + 1);
    resetAutoPlay();
  });

  // ── Dot handlers ─────────────────────────────
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      resetAutoPlay();
    });
  });

  // ── Auto-play ────────────────────────────────
  function startAutoPlay() {
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function stopAutoPlay() {
    clearInterval(autoTimer);
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  startAutoPlay();

  trackContainer.addEventListener('mouseenter', stopAutoPlay);
  trackContainer.addEventListener('mouseleave', startAutoPlay);
  trackContainer.addEventListener('focusin',    stopAutoPlay);
  trackContainer.addEventListener('focusout',   startAutoPlay);

  // ── Touch / Pointer swipe ────────────────────
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerDown   = false;

  trackContainer.addEventListener('pointerdown', (e) => {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerDown   = true;
  }, { passive: true });

  trackContainer.addEventListener('pointerup', (e) => {
    if (!pointerDown) return;
    pointerDown = false;

    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;

    // Only trigger horizontal swipe (not vertical scroll)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      goTo(current + (dx < 0 ? 1 : -1));
      resetAutoPlay();
    }
  }, { passive: true });

  // Cancel on pointer leave (e.g. drag out of element)
  trackContainer.addEventListener('pointerleave', () => {
    pointerDown = false;
  }, { passive: true });

  // Prevent image drag interfering with swipe
  trackContainer.addEventListener('dragstart', (e) => e.preventDefault());

  // ── Keyboard navigation ───────────────────────
  trackContainer.setAttribute('tabindex', '0');
  trackContainer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAutoPlay(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoPlay(); }
  });

  return { goTo };
}

// Initialise both carousels
createCarousel('then', 3);
createCarousel('now',  3);


// ═══════════════════════════════════════════════════
//  3.  COUNT-UP TIMER  (time spent apart)
// ═══════════════════════════════════════════════════

(function initCountUp() {
  // The day she left — adjust this date if needed
  const SINCE = new Date(2016, 8, 5, 0, 0, 0); // Sept 5, 2016

  const elDays    = document.getElementById('cd-days');
  const elHours   = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');

  if (!elDays || !elHours || !elMinutes || !elSeconds) return;

  // Update a cell and trigger flip animation only when value changes
  function setValue(el, val) {
    const str = String(val).padStart(2, '0');
    if (el.textContent === str) return;
    el.textContent = str;
    el.classList.remove('tick');
    void el.offsetWidth; // force reflow to re-trigger animation
    el.classList.add('tick');
  }

  function tick() {
    const elapsed = Math.floor((Date.now() - SINCE.getTime()) / 1000);

    const seconds = elapsed % 60;
    const minutes = Math.floor(elapsed / 60) % 60;
    const hours   = Math.floor(elapsed / 3600) % 24;
    const days    = Math.floor(elapsed / 86400);

    setValue(elDays,    days);
    setValue(elHours,   hours);
    setValue(elMinutes, minutes);
    setValue(elSeconds, seconds);
  }

  tick(); // populate immediately — no blank flash
  setInterval(tick, 1000);
}());


// ═══════════════════════════════════════════════════
//  4.  MAKE A WISH — Confetti + Modal
// ═══════════════════════════════════════════════════

(function initWish() {
  const wishBtn      = document.getElementById('wishBtn');
  const wishModal    = document.getElementById('wishModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose   = document.getElementById('modalClose');

  if (!wishBtn || !wishModal || !modalOverlay || !modalClose) return;

  // ── Modal helpers ─────────────────────────────
  function openModal() {
    wishModal.classList.add('active');
    modalOverlay.classList.add('active');
    wishModal.setAttribute('aria-hidden', 'false');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    wishModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    wishModal.setAttribute('aria-hidden', 'true');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    wishBtn.focus();
  }

  // ── Confetti burst ────────────────────────────
  function fireConfetti() {
    const palette = [
      '#c9963a', '#e4b55a', '#f5e6c0',
      '#fff4d6', '#f7b733', '#ffc0cb',
      '#ffecd2', '#b08060',
    ];

    // Centre burst
    confetti({
      particleCount: 130,
      spread: 85,
      origin: { y: 0.62 },
      colors: palette,
      scalar: 1.15,
      zIndex: 202,
    });

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 58,
        spread: 54,
        origin: { x: 0, y: 0.68 },
        colors: palette,
        zIndex: 202,
      });
    }, 160);

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 122,
        spread: 54,
        origin: { x: 1, y: 0.68 },
        colors: palette,
        zIndex: 202,
      });
    }, 160);

    // Star shower
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 110,
        origin: { y: 0.38 },
        colors: palette,
        shapes: ['star'],
        scalar: 1.6,
        zIndex: 202,
      });
    }, 340);

    // Gentle rain after
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 60,
        gravity: 0.6,
        ticks: 220,
        origin: { y: 0 },
        colors: palette,
        zIndex: 202,
      });
    }, 700);
  }

  // ── Wire up events ────────────────────────────
  wishBtn.addEventListener('click', () => {
    fireConfetti();
    setTimeout(openModal, 650);
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wishModal.classList.contains('active')) {
      closeModal();
    }
  });
}());


// ═══════════════════════════════════════════════════
//  5.  SCROLL REVEAL (Intersection Observer)
// ═══════════════════════════════════════════════════

(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -40px 0px',
  });

  elements.forEach((el) => observer.observe(el));
}());
