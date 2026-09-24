(() => {
  const toggle = document.querySelector('.submenu-toggle');
  const dropdown = toggle?.closest('.dropdown');
  const close = () => {
    if (!dropdown) return;
    dropdown.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle?.addEventListener('click', () => {
    const open = dropdown.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (dropdown && !dropdown.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); toggle?.focus(); }
  });
  dropdown?.addEventListener('focusout', event => {
    if (!dropdown.contains(event.relatedTarget)) close();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('mousemove', event => {
      if (reducedMotion.matches || Math.random() > 0.3) return;
      const sparkle = document.createElement('span');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${event.clientX + (Math.random() * 8 - 4)}px`;
      sparkle.style.top = `${event.clientY + (Math.random() * 8 - 4)}px`;
      document.body.append(sparkle);
      setTimeout(() => sparkle.remove(), 700);
    });
  });
})();
