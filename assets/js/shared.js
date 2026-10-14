(() => {
  // Hide all player-only profile links when the DM is selected.
  const isDM = (sessionStorage.getItem("feywild-character-name") || "").trim().toLowerCase() === "dm";
  if (isDM) {
    document.querySelectorAll('a[href="character-profile.html"], a[href^="character-profile.html#"]').forEach(link => {
      const navItem = link.closest("nav li");
      if (navItem) navItem.remove();
      else link.remove();
    });
  }
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
  // Throttle hover sparkles and limit active elements for smoother performance.
  let lastSparkleAt = 0;
  document.addEventListener('mousemove', event => {
      if (!event.target.closest('a, button')) return;
      if (reducedMotion.matches || document.hidden) return;
      const now = performance.now();
      if (now - lastSparkleAt < 140 || document.querySelectorAll('.sparkle').length >= 12) return;
      lastSparkleAt = now;
      const sparkle = document.createElement('span');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${event.clientX + (Math.random() * 8 - 4)}px`;
      sparkle.style.top = `${event.clientY + (Math.random() * 8 - 4)}px`;
      document.body.append(sparkle);
      setTimeout(() => sparkle.remove(), 700);
  });

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.textContent = '↑ Back to top';
  backToTop.hidden = true;
  document.body.append(backToTop);
  const updateBackToTop = () => { backToTop.hidden = window.scrollY < 500; };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener('click', () => window.scrollTo({
    top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'
  }));
})();
