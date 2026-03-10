/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — rgpd.js
   Sidebar active state · Smooth scroll
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const snavLinks = document.querySelectorAll('.snav-link');
  const sections  = document.querySelectorAll('.rgpd-section');

  /* ── SIDEBAR ACTIVE ON SCROLL ──────────────────────── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        snavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(s => observer.observe(s));

  /* ── SMOOTH SCROLL ─────────────────────────────────── */
  snavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('⚖️ RGPD page — chargée !');
});