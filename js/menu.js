/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — menu.js
   Filtres, recherche, favoris, compteur
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const grid        = document.getElementById('menuGrid');
  const cards       = document.querySelectorAll('.menu-card');
  const sectionTitles = document.querySelectorAll('.menu-section-title');
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('menuSearch');
  const resultCount = document.getElementById('resultCount');
  const noResults   = document.getElementById('noResults');

  let currentFilter = 'all';
  let currentSearch = '';

  /* ── 1. FILTRES PAR CATÉGORIE ─────────────────────── */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  /* ── 2. RECHERCHE EN TEMPS RÉEL ──────────────────── */
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    applyFilters();
  });

  /* ── 3. LOGIQUE DE FILTRAGE ───────────────────────── */
  function applyFilters() {
    let visibleCount = 0;

    // Cards
    cards.forEach(card => {
      const cat      = card.dataset.category;
      const text     = card.textContent.toLowerCase();

      const matchCat    = currentFilter === 'all' || cat === currentFilter;
      const matchSearch = currentSearch === '' || text.includes(currentSearch);

      if (matchCat && matchSearch) {
        showCard(card);
        visibleCount++;
      } else {
        hideCard(card);
      }
    });

    // Section titles — montrer seulement celles qui ont des cartes visibles
    sectionTitles.forEach(title => {
      const titleCat = title.dataset.category;
      const hasVisible = [...cards].some(c =>
        c.dataset.category === titleCat && !c.classList.contains('hidden')
      );

      if (hasVisible) {
        title.classList.remove('hidden');
      } else {
        title.classList.add('hidden');
      }
    });

    // No results
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';

    // Count
    resultCount.textContent = visibleCount === 1
      ? `1 plat`
      : `${visibleCount} plats`;
  }

  function showCard(card) {
    card.classList.remove('hidden');
    card.classList.remove('fade-in');
    void card.offsetWidth; // force reflow
    card.classList.add('fade-in');
  }

  function hideCard(card) {
    card.classList.add('hidden');
    card.classList.remove('fade-in');
  }

  /* ── 4. RESET FILTERS (accessible globalement) ──── */
  window.resetFilters = function () {
    currentFilter = 'all';
    currentSearch = '';
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    applyFilters();
  };

  /* ── 5. FAVORIS ───────────────────────────────────── */
  document.querySelectorAll('.card-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '♥' : '♡';

      // Micro feedback animation
      btn.style.transform = 'scale(1.4)';
      setTimeout(() => btn.style.transform = '', 250);
    });
  });

  /* ── 6. ANIMATION D'ENTRÉE DES CARTES ────────────── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.35s ease, box-shadow 0.35s ease';
    observer.observe(card);
  });

  /* ── 7. FILTRE DEPUIS URL HASH ──────────────────── */
  const hash = window.location.hash.replace('#', '');
  const validFilters = ['antipasti','pizza','pasta','secondi','dolci','vini'];

  if (validFilters.includes(hash)) {
    const targetBtn = document.querySelector(`[data-filter="${hash}"]`);
    if (targetBtn) {
      targetBtn.click();
      setTimeout(() => {
        document.getElementById('menuFilters').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  /* ── 8. KEYBOARD SHORTCUT : "/" = focus search ─── */
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape') {
      searchInput.blur();
      if (currentSearch) {
        searchInput.value = '';
        currentSearch = '';
        applyFilters();
      }
    }
  });

  // Initial count
  resultCount.textContent = `${cards.length} plats`;

  console.log('🍕 Menu page — loaded!');
});