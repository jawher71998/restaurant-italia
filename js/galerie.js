/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — galerie.js
   Filtres Masonry · Lightbox · Keyboard nav
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── ÉLÉMENTS ─────────────────────────────────────── */
  const grid        = document.getElementById('masonryGrid');
  const items       = document.querySelectorAll('.gal-item');
  const filterBtns  = document.querySelectorAll('.gal-filter');
  const galCount    = document.getElementById('galCount');
  const noResults   = document.getElementById('galNoResults');

  // Lightbox
  const lightbox    = document.getElementById('lightbox');
  const backdrop    = document.getElementById('lbBackdrop');
  const lbImg       = document.getElementById('lbImg');
  const lbLoader    = document.getElementById('lbLoader');
  const lbCat       = document.getElementById('lbCat');
  const lbTitle     = document.getElementById('lbTitle');
  const lbDesc      = document.getElementById('lbDesc');
  const lbCounter   = document.getElementById('lbCounter');
  const lbClose     = document.getElementById('lbClose');
  const lbPrev      = document.getElementById('lbPrev');
  const lbNext      = document.getElementById('lbNext');

  let currentFilter    = 'all';
  let visibleItems     = [];
  let currentLbIndex   = 0;

  /* ══════════════════════════════════════════════════
     1. FILTRES
  ══════════════════════════════════════════════════ */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.gfilter;
      applyFilter();
    });
  });

  function applyFilter() {
    let count = 0;

    items.forEach((item, i) => {
      const cat = item.dataset.gcat;
      const match = currentFilter === 'all' || cat === currentFilter;

      if (match) {
        item.classList.remove('hidden');
        // Staggered entrance animation
        setTimeout(() => {
          item.classList.remove('hiding');
          item.classList.add('showing');
          setTimeout(() => item.classList.remove('showing'), 400);
        }, count * 55);
        count++;
      } else {
        item.classList.add('hiding');
        setTimeout(() => {
          item.classList.add('hidden');
          item.classList.remove('hiding');
        }, 250);
      }
    });

    // Update visible items array for lightbox
    setTimeout(() => {
      visibleItems = [...items].filter(item => !item.classList.contains('hidden'));
      updateCount(count);
      noResults.style.display = count === 0 ? 'block' : 'none';
    }, 300);
  }

  function updateCount(n) {
    galCount.textContent = n === 1 ? '1 photo' : n + ' photos';
  }

  // Init
  visibleItems = [...items];
  updateCount(items.length);

  /* ── RESET (accessible globalement) ── */
  window.resetGalFilter = function () {
    currentFilter = 'all';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-gfilter="all"]').classList.add('active');
    applyFilter();
  };

  /* ══════════════════════════════════════════════════
     2. LIGHTBOX — Ouvrir
  ══════════════════════════════════════════════════ */
  items.forEach(item => {
    // Clic sur l'item entier
    item.addEventListener('click', () => {
      const idx = visibleItems.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });

    // Clic sur bouton zoom (même action)
    item.querySelector('.gal-zoom').addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = visibleItems.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  function openLightbox(index) {
    currentLbIndex = index;
    updateLightbox(index);
    lightbox.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    lightbox.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ── Mise à jour du contenu lightbox ── */
  function updateLightbox(index) {
    const item    = visibleItems[index];
    const imgEl   = item.querySelector('.gal-img');
    const overlay = item.querySelector('.gal-overlay');

    const bgUrl = imgEl.style.backgroundImage;
    const cat   = overlay.querySelector('.gal-cat').textContent;
    const title = overlay.querySelector('h3').textContent;
    const desc  = overlay.querySelector('p').textContent;

    // Loader visible
    lbLoader.style.display = 'flex';
    lbImg.style.opacity    = '0';

    // Load image
    const url = bgUrl.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
    const tempImg = new Image();
    tempImg.src = url;
    tempImg.onload = () => {
      lbImg.style.backgroundImage = bgUrl;
      lbImg.style.opacity = '1';
      lbLoader.style.display = 'none';
    };
    tempImg.onerror = () => {
      lbImg.style.backgroundImage = bgUrl;
      lbImg.style.opacity = '1';
      lbLoader.style.display = 'none';
    };

    // Caption
    lbCat.textContent     = cat;
    lbTitle.textContent   = title;
    lbDesc.textContent    = desc;
    lbCounter.textContent = (index + 1) + ' / ' + visibleItems.length;

    // Nav buttons visibility
    lbPrev.style.opacity        = index === 0 ? '0.3' : '1';
    lbPrev.style.pointerEvents  = index === 0 ? 'none' : 'auto';
    lbNext.style.opacity        = index === visibleItems.length - 1 ? '0.3' : '1';
    lbNext.style.pointerEvents  = index === visibleItems.length - 1 ? 'none' : 'auto';
  }

  /* ── Navigation lightbox ── */
  function goPrev() {
    if (currentLbIndex > 0) {
      currentLbIndex--;
      updateLightbox(currentLbIndex);
    }
  }

  function goNext() {
    if (currentLbIndex < visibleItems.length - 1) {
      currentLbIndex++;
      updateLightbox(currentLbIndex);
    }
  }

  lbClose.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });

  /* ── Keyboard ── */
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  /* ── Touch swipe sur mobile ── */
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? goPrev() : goNext();
    }
  });

  /* ══════════════════════════════════════════════════
     3. SCROLL REVEAL des items
  ══════════════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0) scale(1)';
        }, i * 70);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

  items.forEach(item => {
    item.style.opacity    = '0';
    item.style.transform  = 'translateY(20px) scale(0.97)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)';
    revealObserver.observe(item);
  });

  console.log('🖼️ Galerie — chargée !');
});