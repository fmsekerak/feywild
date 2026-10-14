(() => {
  const canvas = document.getElementById('bannerParticles');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffb3ff', '#b6f5d8', '#ffe4ff', '#d9f5b0'];
  let particles = [], frame = null;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(bounds.width));
    canvas.height = Math.max(1, Math.round(bounds.height));
    const count = canvas.width < 600 ? 18 : 36;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.7, dx: (Math.random() - 0.5) * 0.28,
      dy: (Math.random() - 0.5) * 0.28, opacity: Math.random() * 0.45 + 0.25,
      opacitySpeed: Math.random() * 0.006 + 0.003,
      colorIndex: Math.floor(Math.random() * colors.length),
      colorSpeed: Math.random() * 0.008 + 0.003
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
      if (!reducedMotion.matches && particle.r > 1.25) {
        context.globalAlpha = particle.opacity * 0.12;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r * 3.5, 0, Math.PI * 2);
        context.fill();
      }
      if (reducedMotion.matches) continue;
      particle.opacity += particle.opacitySpeed;
      if (particle.opacity > 0.75 || particle.opacity < 0.2) particle.opacitySpeed *= -1;
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
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', update);
  else if (reducedMotion.addListener) reducedMotion.addListener(update);
})();
