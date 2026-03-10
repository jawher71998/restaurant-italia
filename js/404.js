/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — 404.js
   Recherche rapide · Countdown · Auto-redirect
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════
     1. MINI MOTEUR DE RECHERCHE
  ══════════════════════════════════════════════════ */
  const SITE_PAGES = [
    { icon:'🏠', label:'Accueil',                   url:'index.html',       keywords:['accueil','home','retour','start'] },
    { icon:'🍕', label:'Pizza Napolitana',           url:'menu.html#pizza',  keywords:['pizza','napolitana','margherita','diavola','formaggi'] },
    { icon:'🍝', label:'Tagliatelle al Ragù',        url:'menu.html#pasta',  keywords:['pasta','tagliatelle','ragù','ragu','bolognaise','spaghetti','carbonara'] },
    { icon:'🦞', label:'Linguine all\'Astice',       url:'menu.html#pasta',  keywords:['linguine','homard','astice','fruits de mer'] },
    { icon:'🥩', label:'Osso Buco alla Milanese',    url:'menu.html#secondi',keywords:['osso','buco','veau','viande','milanaise','secondi'] },
    { icon:'🍮', label:'Tiramisù della Nonna',       url:'menu.html#dolci',  keywords:['tiramisu','dolci','dessert','nonna','café'] },
    { icon:'🧀', label:'Burrata di Puglia',          url:'menu.html#antipasti',keywords:['burrata','antipasti','entrée','fromage','puglia'] },
    { icon:'🍷', label:'Carte des Vins — Barolo',   url:'menu.html#vins',   keywords:['vin','barolo','prosecco','cave','vini','alcool'] },
    { icon:'📅', label:'Réservation de table',       url:'reservation.html', keywords:['reservation','réservation','réserver','table','book','booking'] },
    { icon:'🗺️', label:'Horaires & Adresse',        url:'index.html#hours', keywords:['horaire','adresse','heures','ouverture','fermé','fermeture','où','comment','paris','métro'] },
    { icon:'📷', label:'Galerie photos',             url:'galerie.html',     keywords:['galerie','photo','image','photo','voir','ambiance'] },
    { icon:'👨‍🍳', label:'Notre Chef — À propos',    url:'index.html#about', keywords:['chef','antonio','histoire','propos','about','equipe'] },
    { icon:'📞', label:'Nous contacter',             url:'index.html#hours', keywords:['contact','téléphone','appeler','email','mail','message'] },
    { icon:'🍽️', label:'Menu complet',              url:'menu.html',        keywords:['menu','carte','plat','manger','déjeuner','dîner'] },
  ];

  const searchInput   = document.getElementById('errSearch');
  const searchBtn     = document.getElementById('errSearchBtn');
  const resultsDiv    = document.getElementById('errSearchResults');

  function doSearch() {
    const query = searchInput.value.trim().toLowerCase();
    resultsDiv.innerHTML = '';

    if (!query || query.length < 2) return;

    const matches = SITE_PAGES.filter(page =>
      page.keywords.some(kw => kw.includes(query) || query.includes(kw)) ||
      page.label.toLowerCase().includes(query)
    ).slice(0, 4);

    if (matches.length === 0) {
      resultsDiv.innerHTML = `
        <div class="search-result-item" style="cursor:default; opacity:0.5;">
          <span class="sri-icon">😕</span>
          <span class="sri-label">Aucun résultat — <a href="index.html" style="color:var(--terracotta)">retour à l'accueil</a></span>
        </div>`;
      return;
    }

    matches.forEach((page, i) => {
      const a = document.createElement('a');
      a.className = 'search-result-item';
      a.href = page.url;
      a.innerHTML = `
        <span class="sri-icon">${page.icon}</span>
        <span class="sri-label">${page.label}</span>
        <span class="sri-url">${page.url}</span>`;
      a.style.animationDelay = `${i * 60}ms`;
      resultsDiv.appendChild(a);
    });
  }

  searchInput.addEventListener('input', doSearch);
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Auto-focus la barre de recherche
  setTimeout(() => searchInput.focus(), 800);

  /* ══════════════════════════════════════════════════
     2. COUNTDOWN + AUTO-REDIRECT
  ══════════════════════════════════════════════════ */
  const countdownEl = document.getElementById('countdown');
  const timerEl     = document.getElementById('errTimer');
  let seconds       = 15;
  let redirectTimer;

  function startCountdown() {
    redirectTimer = setInterval(() => {
      seconds--;
      if (countdownEl) countdownEl.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(redirectTimer);
        window.location.href = 'index.html';
      }
    }, 1000);
  }

  // Pause countdown si l'utilisateur interagit
  function pauseCountdown() {
    if (redirectTimer) {
      clearInterval(redirectTimer);
      redirectTimer = null;
      if (timerEl) timerEl.style.display = 'none';
    }
  }

  searchInput.addEventListener('focus', pauseCountdown);
  document.querySelectorAll('.err-link-card').forEach(el => {
    el.addEventListener('mouseenter', pauseCountdown);
  });

  startCountdown();

  /* ══════════════════════════════════════════════════
     3. ANIMATION ENTRÉE EN SCÈNE
  ══════════════════════════════════════════════════ */
  // Animer le numéro 404 décoratif
  const decoNum = document.querySelector('.err-deco-num');
  if (decoNum) {
    decoNum.style.opacity = '0';
    decoNum.style.transform = 'translate(-50%, -50%) scale(1.1)';
    decoNum.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    setTimeout(() => {
      decoNum.style.opacity = '0.018';
      decoNum.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 200);
  }

  console.log('🍕 404 page — chargée !');
});