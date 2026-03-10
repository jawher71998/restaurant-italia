/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — advanced-animations.js
   Parallaxe · Magnetic buttons · Tilt 3D · Progress bar
   Text reveals · Stagger avancé · Cursor glow
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Utilitaire : exécuter après DOMContentLoaded ── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ══════════════════════════════════════════════════
     1. BARRE DE PROGRESSION DU SCROLL
  ══════════════════════════════════════════════════ */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scrollProgressBar';
    bar.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(to right, #C4622D, #C9A84C, #C4622D);
      background-size: 200% 100%;
      z-index: 9999;
      pointer-events: none;
      transition: width 0.1s linear;
      animation: shimmerBar 2s linear infinite;
    `;
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const total    = document.body.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     2. PARALLAXE HERO
  ══════════════════════════════════════════════════ */
  function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          const speed    = 0.35;
          // Déplace le fond vers le bas au scroll (effet parallaxe)
          heroBg.style.transform = `translateY(${scrolled * speed}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     3. EFFET TILT 3D SUR LES CARDS
  ══════════════════════════════════════════════════ */
  function initTiltCards() {
    const cards = document.querySelectorAll('.spec-card, .testi-card, .gal-item, .err-link-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect    = card.getBoundingClientRect();
        const centerX = rect.left + rect.width  / 2;
        const centerY = rect.top  + rect.height / 2;
        const deltaX  = (e.clientX - centerX) / (rect.width  / 2);
        const deltaY  = (e.clientY - centerY) / (rect.height / 2);
        const maxTilt = 6; // degrés max

        card.style.transform = `
          perspective(600px)
          rotateX(${-deltaY * maxTilt}deg)
          rotateY(${deltaX  * maxTilt}deg)
          scale(1.02)
        `;
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });
  }

  /* ══════════════════════════════════════════════════
     4. BOUTONS MAGNÉTIQUES
     (le bouton suit légèrement le curseur)
  ══════════════════════════════════════════════════ */
  function initMagneticButtons() {
    const btns = document.querySelectorAll('.btn-primary, .nav-cta, .sidebar-cta');

    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect    = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width  / 2;
        const centerY = rect.top  + rect.height / 2;
        const deltaX  = (e.clientX - centerX) * 0.25;
        const deltaY  = (e.clientY - centerY) * 0.25;

        btn.style.transform  = `translate(${deltaX}px, ${deltaY}px)`;
        btn.style.transition = 'transform 0.15s ease';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform  = '';
        btn.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });
  }

  /* ══════════════════════════════════════════════════
     5. SPLIT TEXT — ANIMATION TITRE PAR LETTRE
  ══════════════════════════════════════════════════ */
  function initSplitText() {
    const targets = document.querySelectorAll('.section-title, .hero-title, .gal-hero-title, .rgpd-title');

    targets.forEach(el => {
      if (el.dataset.split) return; // déjà traité
      el.dataset.split = 'true';

      // Préserver le HTML (balises <em>, <br>, etc.)
      // On wrap chaque nœud texte lettre par lettre
      function wrapTextNodes(node, delayStart) {
        let letterIndex = delayStart;
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent;
            const frag = document.createDocumentFragment();
            [...text].forEach(char => {
              if (char === ' ') {
                frag.appendChild(document.createTextNode(' '));
              } else {
                const span = document.createElement('span');
                span.className    = 'split-char';
                span.textContent  = char;
                span.style.cssText = `
                  display: inline-block;
                  opacity: 0;
                  transform: translateY(25px) rotate(3deg);
                  transition: opacity 0.5s ease ${letterIndex * 0.032}s,
                              transform 0.5s cubic-bezier(0.22,1,0.36,1) ${letterIndex * 0.032}s;
                `;
                frag.appendChild(span);
                letterIndex++;
              }
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            letterIndex = wrapTextNodes(child, letterIndex);
          }
        });
        return letterIndex;
      }

      wrapTextNodes(el, 0);

      // Observer pour déclencher l'animation
      const splitObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.split-char').forEach(char => {
              char.style.opacity   = '1';
              char.style.transform = 'translateY(0) rotate(0deg)';
            });
            splitObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      splitObs.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════
     6. STAGGER REVEAL AVANCÉ
     (entrée en cascade avec easing élastique)
  ══════════════════════════════════════════════════ */
  function initAdvancedReveal() {
    // Groupes de cartes à animer ensemble
    const groups = [
      { selector: '.spec-card',    stagger: 100 },
      { selector: '.testi-card',   stagger: 80  },
      { selector: '.stat-item',    stagger: 120 },
      { selector: '.menu-card',    stagger: 55  },
      { selector: '.gal-item',     stagger: 60  },
      { selector: '.droit-item',   stagger: 80  },
      { selector: '.info-card',    stagger: 100 },
      { selector: '.cv-card',      stagger: 100 },
      { selector: '.err-link-card',stagger: 80  },
    ];

    groups.forEach(({ selector, stagger }) => {
      const items = document.querySelectorAll(selector);
      if (!items.length) return;

      // Initialiser l'état caché (si pas déjà fait par galerie.js)
      items.forEach(item => {
        if (!item.style.opacity || item.style.opacity === '') {
          item.style.opacity   = '0';
          item.style.transform = 'translateY(30px) scale(0.96)';
          item.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)';
        }
      });

      // Observer le container parent
      const parent = items[0].parentElement;
      const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            items.forEach((item, i) => {
              setTimeout(() => {
                item.style.opacity   = '1';
                item.style.transform = 'translateY(0) scale(1)';
              }, i * stagger);
            });
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

      revealObs.observe(parent);
    });
  }

  /* ══════════════════════════════════════════════════
     7. CURSOR GLOW (desktop seulement)
  ══════════════════════════════════════════════════ */
  function initCursorGlow() {
    // Pas sur mobile / tactile
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const glow = document.createElement('div');
    glow.id = 'cursorGlow';
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(196,98,45,0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX  = 0, glowY  = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });

    // Lerp pour un mouvement fluide
    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top  = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();

    // Grossir sur les éléments interactifs
    const interactives = document.querySelectorAll('a, button, .spec-card, .gal-item, .testi-card');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        glow.style.width  = '450px';
        glow.style.height = '450px';
        glow.style.background = 'radial-gradient(circle, rgba(196,98,45,0.12) 0%, transparent 70%)';
      });
      el.addEventListener('mouseleave', () => {
        glow.style.width  = '300px';
        glow.style.height = '300px';
        glow.style.background = 'radial-gradient(circle, rgba(196,98,45,0.08) 0%, transparent 70%)';
      });
    });
  }

  /* ══════════════════════════════════════════════════
     8. LIGNE DÉCORATIVE ANIMÉE SOUS LES TITRES
  ══════════════════════════════════════════════════ */
  function initDecorativeLines() {
    const eyebrows = document.querySelectorAll('.section-eyebrow');

    eyebrows.forEach(el => {
      const lineObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('eyebrow-visible');
            lineObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      lineObs.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════
     9. SMOOTH IMAGE LOAD (éviter le flash)
  ══════════════════════════════════════════════════ */
  function initImageReveal() {
    const bgDivs = document.querySelectorAll('.spec-img-photo, .mosaic-item, .gal-img, .gal-hero-bg, .menu-hero-bg');

    bgDivs.forEach(div => {
      const bgUrl = div.style.backgroundImage
        || getComputedStyle(div).backgroundImage;

      if (!bgUrl || bgUrl === 'none') return;

      const url = bgUrl.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
      if (!url) return;

      div.style.opacity = '0';
      div.style.transition = 'opacity 0.8s ease';

      const img = new Image();
      img.src = url;
      img.onload = () => { div.style.opacity = '1'; };
      img.onerror = () => { div.style.opacity = '1'; };
    });
  }

  /* ══════════════════════════════════════════════════
     10. PARALLAXE SECTIONS SECONDAIRES
  ══════════════════════════════════════════════════ */
  function initSectionParallax() {
    const elements = [
      { selector: '.about-img-wrap',  speed: 0.08 },
      { selector: '.menu-hero-bg',    speed: 0.25 },
      { selector: '.gal-hero-bg',     speed: 0.25 },
    ];

    const parallaxEls = elements.map(({ selector, speed }) => {
      const el = document.querySelector(selector);
      return el ? { el, speed } : null;
    }).filter(Boolean);

    if (!parallaxEls.length) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          parallaxEls.forEach(({ el, speed }) => {
            const rect    = el.getBoundingClientRect();
            const viewH   = window.innerHeight;
            if (rect.bottom < 0 || rect.top > viewH) return;
            const center  = rect.top + rect.height / 2 - viewH / 2;
            el.style.transform = `translateY(${center * speed}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     INIT ALL
  ══════════════════════════════════════════════════ */
  ready(() => {
    // Respecter prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initScrollProgress();             // Toujours

    if (!prefersReduced) {
      initHeroParallax();
      initSectionParallax();
      initTiltCards();
      initMagneticButtons();
      initSplitText();
      initCursorGlow();
      initImageReveal();
    }

    initAdvancedReveal();             // Toujours (juste des transitions CSS)
    initDecorativeLines();            // Toujours

    console.log('✨ Advanced animations — loaded!');
  });

})();