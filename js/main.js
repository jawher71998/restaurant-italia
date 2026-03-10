/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — main.js
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. NAVBAR SCROLL ─────────────────────────────── */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* ── 2. BURGER MENU ───────────────────────────────── */
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('open');
    navbar.classList.toggle('open');
  });

  // Fermer le menu au clic sur un lien
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('open');
      navbar.classList.remove('open');
    });
  });

  /* ── 3. SCROLL REVEAL ─────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.spec-card, .testi-card, .mosaic-item, .about-container > *, ' +
    '.hours-container > *, .stat-item, .highlight-item'
  );

  revealEls.forEach(el => el.classList.add('scroll-reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* ── 4. COUNTER ANIMATION ─────────────────────────── */
  const counters = document.querySelectorAll('.stat-num');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target);
        const dur    = 1800;
        const step   = 16;
        const inc    = target / (dur / step);
        let current  = 0;

        const update = () => {
          current += inc;
          if (current < target) {
            el.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(update);
          } else {
            el.textContent = target.toLocaleString();
          }
        };

        update();
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => countObserver.observe(c));

  /* ── 5. TESTIMONIALS DOTS ─────────────────────────── */
  const dots    = document.querySelectorAll('.dot');
  const cards   = document.querySelectorAll('.testi-card');

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');

      // Sur mobile, scroll vers la carte
      const idx  = parseInt(dot.dataset.idx);
      const card = cards[idx];
      if (card && window.innerWidth < 768) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });

  // Auto-rotate dots
  let current = 0;
  setInterval(() => {
    current = (current + 1) % dots.length;
    dots.forEach(d => d.classList.remove('active'));
    dots[current].classList.add('active');

    if (window.innerWidth < 768 && cards[current]) {
      cards[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, 5000);

  /* ── 6. SMOOTH ANCHOR SCROLL ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = navbar.offsetHeight + 20;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── 7. NEWSLETTER FORM ───────────────────────────── */
  const newsletterBtn = document.querySelector('.newsletter-form button');
  const newsletterInput = document.querySelector('.newsletter-form input');

  if (newsletterBtn && newsletterInput) {
    newsletterBtn.addEventListener('click', () => {
      const email = newsletterInput.value.trim();
      if (email && email.includes('@')) {
        newsletterInput.value = '';
        newsletterInput.placeholder = '✓ Merci de votre inscription !';
        newsletterBtn.textContent = '✓';
        newsletterBtn.style.background = '#2a9d4e';
        setTimeout(() => {
          newsletterInput.placeholder = 'Votre email...';
          newsletterBtn.textContent = '→';
          newsletterBtn.style.background = '';
        }, 3000);
      } else {
        newsletterInput.style.outline = '2px solid #e74c3c';
        setTimeout(() => newsletterInput.style.outline = '', 1500);
      }
    });
  }

  /* ── 8. ACTIVE NAV LINK ON SCROLL ────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  console.log('🍕 La Tavola di Roma — loaded!');
});