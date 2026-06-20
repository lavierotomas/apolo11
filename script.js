  // STARFIELD
  const canvas = document.getElementById('stars-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.3 + 0.2,
    a: Math.random(),
    speed: Math.random() * 0.004 + 0.001,
    phase: Math.random() * Math.PI * 2
  }));

  let frame = 0;
  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame += 0.01;
    stars.forEach(s => {
      const alpha = s.a * (0.6 + 0.4 * Math.sin(frame * s.speed * 30 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 215, 255, ${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();

  // SCROLL REVEAL
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => io.observe(el));

  // BIBLIOGRAPHY TOGGLE
  function toggleBiblio(id) {
    const el = document.getElementById(id);
    el.classList.toggle('open');
    const btn = el.previousElementSibling;
    btn.textContent = el.classList.contains('open') ? '📚 Cerrar Bibliografía' : '📚 Ver Bibliografía';
  }

  // VIDEO AUTOPLAY ON SCROLL (video nativo <video>)
  // Arranca muteado y en loop cuando el video entra en pantalla (requisito de
  // los navegadores, sobre todo en mobile). Si el navegador igual bloquea el
  // autoplay, queda visible un botón central de play como respaldo.
  (function () {
    const wrap = document.getElementById('kennedyVideo');
    const vid = document.getElementById('kennedyVideoTag');
    if (!wrap || !vid) return;

    const soundBtn = document.getElementById('kennedySoundToggle');
    const playCenter = document.getElementById('kennedyPlayCenter');
    let triedAutoplay = false;

    function attemptPlay() {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            wrap.classList.add('is-playing');
          })
          .catch(() => {
            // El navegador bloqueó el autoplay: dejamos el botón central visible
            wrap.classList.remove('is-playing');
          });
      }
    }

    // Tap/click manual sobre el botón central (respaldo si el autoplay falló,
    // y también sirve como primer "toque" en iOS para destrabar reproducción)
    playCenter.addEventListener('click', function () {
      attemptPlay();
    });

    vid.addEventListener('playing', function () {
      wrap.classList.add('is-playing');
    });

    vid.addEventListener('pause', function () {
      wrap.classList.remove('is-playing');
    });

    soundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      vid.muted = !vid.muted;
      soundBtn.textContent = vid.muted ? '🔇 Activar sonido' : '🔊 Sonido activado';
    });

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!triedAutoplay) {
            triedAutoplay = true;
            attemptPlay();
          } else if (vid.paused) {
            attemptPlay();
          }
        } else {
          if (!vid.paused) vid.pause();
        }
      });
    }, { threshold: 0.5 });

    videoObserver.observe(wrap);
  })();
