/**
 * Wedding Invitation Website
 * Mobile-First Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const invitationApp = document.getElementById('invitationApp');
  const coverView = document.getElementById('coverView');
  const replayBtn = document.getElementById('replayBtn');
  const sparklesContainer = document.getElementById('sparkles');

  const innerView = document.getElementById('innerView');
  const gopuramView = document.getElementById('gopuramView');
  const gopuramImg = document.getElementById('gopuramImg');
  const mandapamLayer = document.getElementById('mandapamLayer');
  const curtainEdge = document.getElementById('curtainEdge');
  const glowFlash = document.getElementById('glowFlash');

  const skyText = document.getElementById('skyText');
  const finalScroll = document.getElementById('finalScroll');
  const finalFx = document.getElementById('finalFx');
  const lightbox = document.getElementById('lightbox');
  // Optional: WhatsApp number in international format, digits only (e.g. '919876543210'). Leave '' to just show a thank-you.
  const WHATSAPP_NUMBER = '';
  let skyTimer = null, upAcc = 0;

  // Split names into letters for the slow reveal
  let letterIdx = 0;
  document.querySelectorAll('#names [data-t]').forEach((el) => {
    [...el.dataset.t].forEach((c) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', letterIdx++);
      s.textContent = c;
      el.appendChild(s);
    });
  });

  // Split sky text into words for word-by-word reveal
  let wordDelay = 0.15;
  document.querySelectorAll('#skyText .sl').forEach((line) => {
    if (line.classList.contains('sl5')) {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.setProperty('--d', `${wordDelay.toFixed(2)}s`);
      span.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(span);
      wordDelay += 0.25;
      return;
    }
    const words = line.textContent.trim().split(/\s+/);
    line.innerHTML = '';
    words.forEach((w) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.setProperty('--d', `${wordDelay.toFixed(2)}s`);
      span.textContent = w;
      line.appendChild(span);
      line.appendChild(document.createTextNode(' '));
      wordDelay += 0.15;
    });
    wordDelay += 0.18;
  });

  let isOpening = false;
  let settledTimer = null;

  // Screen 3 state
  let stage = 'cover'; // cover | hands | transition | gopuram
  let inputReady = false;
  let target = 0, current = 0, rafId = null;
  let swapTimer = null, readyTimer = null;
  let wiped = false, wiping = false, wipeRaf = null;
  const WIPE_MS = 850;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Open Invitation Handler
  function openInvitation() {
    if (isOpening || invitationApp.classList.contains('is-opened')) return;
    isOpening = true;

    // Trigger Flaps & Hands
    invitationApp.classList.add('is-opened');

    // After hands slide in and settle (~4.4s - 4.6s), enable gentle floating animation
    clearTimeout(settledTimer);
    settledTimer = setTimeout(() => {
      invitationApp.classList.add('hands-settled');
      innerView.classList.add('is-ready');
      stage = 'hands';
      isOpening = false;
    }, 4600);
  }

  // Close / Replay Handler
  function closeInvitation() {
    clearTimeout(settledTimer);
    invitationApp.classList.remove('hands-settled');
    invitationApp.classList.remove('is-opened');
    innerView.classList.remove('is-ready');
    clearTimeout(swapTimer);
    clearTimeout(readyTimer);
    clearTimeout(skyTimer);
    gopuramView.classList.remove('show');
    finalScroll.scrollTop = 0;
    finalScroll.querySelectorAll('.card').forEach((c) => c.classList.remove('in'));
    upAcc = 0;
    cancelAnimationFrame(rafId);
    glowFlash.classList.remove('play');
    gopuramView.classList.remove('is-active');
    cancelAnimationFrame(wipeRaf);
    wiped = wiping = false;
    setWipe(0);
    target = current = 0;
    inputReady = false;
    render(0);
    stage = 'cover';
    isOpening = false;
  }

  // ---------- Screen 3: glow -> gopuram scroll -> curtain wipe ----------
  function setWipe(c) {
    const e = c * c * (3 - 2 * c); // smooth
    const val = `inset(${(1 - e) * 100}% 0 0 0)`;
    mandapamLayer.style.clipPath = val;
    mandapamLayer.style.webkitClipPath = val;
    curtainEdge.style.top = `${(1 - e) * 100}%`;
    curtainEdge.style.opacity = (c > 0 && c < 1) ? 1 : 0;
  }

  // p: 0 = top of gopuram (sky/kalasam), 1 = base
  function render(p) {
    const hImg = gopuramImg.offsetHeight;
    const hBox = gopuramView.clientHeight;
    const range = Math.max(0, hImg - hBox);
    gopuramImg.style.transform = `translate3d(0, ${-clamp(p) * range}px, 0)`;
    skyText.style.transform = `translate3d(0, ${-clamp(p) * range}px, 0)`;
  }

  // One scroll -> full curtain wipe (forward or reverse)
  function playWipe(forward) {
    if (wiping) return;
    wiping = true;
    inputReady = false;
    const t0 = performance.now();
    const from = forward ? 0 : 1;
    const to = forward ? 1 : 0;
    function step(now) {
      const t = clamp((now - t0) / WIPE_MS);
      setWipe(from + (to - from) * t);
      if (t < 1) {
        wipeRaf = requestAnimationFrame(step);
      } else {
        wiping = false;
        wiped = forward;
        inputReady = true;
        if (!forward) target = 0.97;
      }
    }
    wipeRaf = requestAnimationFrame(step);
  }

  function loop() {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.0005) current = target;
    render(current);
    if (!wiped && !wiping && inputReady && target >= 1 && current > 0.985) playWipe(true);
    rafId = requestAnimationFrame(loop);
  }

  function startGopuram() {
    if (stage !== 'hands') return;
    stage = 'transition';
    glowFlash.classList.remove('play');
    void glowFlash.offsetWidth;
    glowFlash.classList.add('play');

    // Swap scenes at the peak of the glow
    swapTimer = setTimeout(() => {
      target = current = 0;
      render(0);
      gopuramView.classList.add('is-active');
      skyTimer = setTimeout(() => gopuramView.classList.add('show'), 600);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }, 850);

    readyTimer = setTimeout(() => {
      stage = 'gopuram';
      inputReady = true;
    }, 1700);
  }

  function nudge(delta) {
    if (!inputReady) return;
    if (wiped) {
      // Cards scroll natively; scrolling up past the top brings the gopuram back
      if (delta < 0 && finalScroll.scrollTop <= 2) {
        upAcc += -delta;
        if (upAcc > 0.12) { upAcc = 0; playWipe(false); }
      } else { upAcc = 0; }
      return;
    }
    target = clamp(target + delta);
  }

  innerView.addEventListener('click', startGopuram);

  window.addEventListener('wheel', (e) => nudge(e.deltaY / 1400), { passive: true });

  let lastY = null;
  window.addEventListener('touchstart', (e) => { lastY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (lastY === null) return;
    const y = e.touches[0].clientY;
    nudge((lastY - y) / 650);
    lastY = y;
  }, { passive: true });
  window.addEventListener('touchend', () => { lastY = null; });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') nudge(0.08);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') nudge(-0.08);
  });
  window.addEventListener('keydown', (e) => {
    if (!wiped) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') finalScroll.scrollBy({ top: 120, behavior: 'smooth' });
  });
  window.addEventListener('resize', () => render(current));
  gopuramImg.addEventListener('load', () => render(current));

  // Tap / click anywhere on the closed card to open it
  coverView.addEventListener('click', (e) => {
    e.stopPropagation();
    openInvitation();
  });

  // Keyboard access: Enter or Space opens the card
  coverView.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openInvitation();
    }
  });

  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeInvitation();
  });

  // Generate Festive Background Sparkles
  function createSparkles() {
    if (!sparklesContainer) return;
    const count = 25;
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.classList.add('sparkle');
      
      const left = Math.random() * 100;
      const duration = 4 + Math.random() * 5;
      const delay = Math.random() * 6;
      const size = 3 + Math.random() * 3;

      sparkle.style.left = `${left}%`;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.animationDuration = `${duration}s`;
      sparkle.style.animationDelay = `${delay}s`;

      sparklesContainer.appendChild(sparkle);
    }
  }

  createSparkles();

  // ---------- Final scene: moving petals + golden motes ----------
  const petalColors = ['#f4b6c2', '#fff', '#f8d7dc', '#ffe9b0'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = petalColors[i % petalColors.length];
    p.style.animationDuration = `${11 + Math.random() * 10}s, ${3 + Math.random() * 3}s`;
    p.style.animationDelay = `${-Math.random() * 18}s, ${-Math.random() * 4}s`;
    finalFx.appendChild(p);
  }
  for (let i = 0; i < 14; i++) {
    const m = document.createElement('span');
    const s = 4 + Math.random() * 5;
    m.className = 'mote';
    m.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${5 + Math.random() * 5}s;animation-delay:${-Math.random() * 8}s`;
    finalFx.appendChild(m);
  }

  // ---------- Cards: reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { root: finalScroll, threshold: 0.2 });
  const observeCards = () => finalScroll.querySelectorAll('.card:not(.in)').forEach((c) => io.observe(c));
  observeCards();
  replayBtn.addEventListener('click', () => setTimeout(observeCards, 50));

  // ---------- Gallery lightbox ----------
  finalScroll.querySelectorAll('.grid img').forEach((img) => {
    img.addEventListener('click', () => { lightbox.querySelector('img').src = img.src; lightbox.classList.add('on'); });
  });
  lightbox.addEventListener('click', () => lightbox.classList.remove('on'));

  // ---------- RSVP ----------
  document.getElementById('rsvpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = `RSVP - ${document.getElementById('rName').value}: ${document.getElementById('rAttend').value}, guests: ${document.getElementById('rGuests').value}`;
    document.getElementById('rOk').style.display = 'block';
    if (WHATSAPP_NUMBER) window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  });
});
