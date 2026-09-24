(() => {
  const canvas = document.getElementById('bannerParticles');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffb3ff', '#ff9cff', '#ffffff', '#ffe4ff'];
  let particles = [], frame = null;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const count = canvas.width < 600 ? 40 : 80;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1, dx: (Math.random() - 0.5) / 2,
      dy: (Math.random() - 0.5) / 2, opacity: Math.random() * 0.7 + 0.3,
      opacitySpeed: Math.random() * 0.02 + 0.01,
      colorIndex: Math.floor(Math.random() * colors.length),
      colorSpeed: Math.random() * 0.02 + 0.01
    }));
    draw();
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const particle of particles) {
      const color = colors[Math.floor(particle.colorIndex) % colors.length];
      context.globalAlpha = particle.opacity;
      context.fillStyle = color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
      if (reducedMotion.matches) continue;
      particle.opacity += particle.opacitySpeed;
      if (particle.opacity > 1 || particle.opacity < 0.3) particle.opacitySpeed *= -1;
      particle.colorIndex = (particle.colorIndex + particle.colorSpeed) % colors.length;
      particle.x = (particle.x + particle.dx + canvas.width) % canvas.width;
      particle.y = (particle.y + particle.dy + canvas.height) % canvas.height;
    }
    context.globalAlpha = 1;
  }

  function animate() {
    frame = null;
    if (document.hidden || reducedMotion.matches) return;
    draw();
    frame = requestAnimationFrame(animate);
  }

  function update() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    draw();
    if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  resize();
  update();
  window.addEventListener('resize', () => { resize(); update(); });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
})();
