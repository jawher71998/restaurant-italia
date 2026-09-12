/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — menu-editor.js
   Éditeur de menu complet — CRUD
═══════════════════════════════════════════════════════ */

(function () {

  /* ── Données démo ────────────────────────────────────── */
  let MENU_DATA = [
    { id:1,  nom:'Bruschetta al Pomodoro',     cat:'entrees',  prix:9,  desc:'Pain grillé, tomates fraîches, basilic, huile d\'olive extra vierge.',  vege:true,  chef:false, new:false, dispo:true },
    { id:2,  nom:'Carpaccio di Manzo',         cat:'entrees',  prix:16, desc:'Fines tranches de bœuf, roquette, parmesan, câpres.',                   vege:false, chef:true,  new:false, dispo:true },
    { id:3,  nom:'Burrata Pugliese',           cat:'entrees',  prix:14, desc:'Burrata crémeuse, tomates cerises, huile d\'olive, fleur de sel.',       vege:true,  chef:false, new:true,  dispo:true },
    { id:4,  nom:'Tagliatelle al Tartufo',     cat:'pates',    prix:28, desc:'Tagliatelle fraîches, truffe noire, beurre de truffe, parmesan.',        vege:true,  chef:true,  new:false, dispo:true },
    { id:5,  nom:'Spaghetti alle Vongole',     cat:'pates',    prix:24, desc:'Spaghetti, coques fraîches, ail, vin blanc, persil.',                   vege:false, chef:false, new:false, dispo:true },
    { id:6,  nom:'Penne all\'Arrabbiata',      cat:'pates',    prix:18, desc:'Penne, sauce tomate épicée, ail, piment rouge, basilic.',                vege:true,  chef:false, new:false, dispo:true },
    { id:7,  nom:'Pizza Margherita DOP',       cat:'pizzas',   prix:19, desc:'Tomate San Marzano, mozzarella di bufala, basilic frais.',               vege:true,  chef:false, new:false, dispo:true },
    { id:8,  nom:'Pizza Tartufo e Funghi',     cat:'pizzas',   prix:27, desc:'Crème de truffe, champignons sauvages, mozzarella, roquette.',           vege:true,  chef:true,  new:false, dispo:true },
    { id:9,  nom:'Bistecca alla Fiorentina',   cat:'viandes',  prix:45, desc:'Côte de bœuf Fiorentina 600g, romarin, ail, huile d\'olive.',           vege:false, chef:true,  new:false, dispo:true },
    { id:10, nom:'Osso Buco alla Milanese',    cat:'viandes',  prix:34, desc:'Jarret de veau braisé, gremolata, risotto au safran.',                  vege:false, chef:false, new:false, dispo:true },
    { id:11, nom:'Tiramisù della Nonna',       cat:'desserts', prix:11, desc:'Recette traditionnelle, mascarpone, café, biscuits savoiardi.',          vege:true,  chef:true,  new:false, dispo:true },
    { id:12, nom:'Panna Cotta al Caramello',   cat:'desserts', prix:9,  desc:'Panna cotta vanille, caramel fleur de sel, noisettes grillées.',         vege:true,  chef:false, new:false, dispo:true },
    { id:13, nom:'Barolo DOCG 2019',           cat:'boissons', prix:85, desc:'Cépage Nebbiolo, Piémont. Tanins élégants, notes de cerise et tabac.',  vege:true,  chef:false, new:false, dispo:true },
    { id:14, nom:'Limoncello Artisanal',       cat:'boissons', prix:8,  desc:'Citrons de Sorrente, recette maison du Chef.',                          vege:true,  chef:false, new:false, dispo:true },
  ];

  let currentCat = 'all';
  let editingId  = null;
  let nextId     = 15;

  const CAT_LABELS = {
    entrees:  '🥗 Entrées',
    pates:    '🍝 Pâtes',
    pizzas:   '🍕 Pizzas',
    viandes:  '🥩 Viandes',
    desserts: '🍮 Desserts',
    boissons: '🍷 Boissons',
  };

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {

    // Charger le menu au clic sur l'onglet
    document.querySelector('[data-section="menu"]')?.addEventListener('click', renderMenu);

    // Filtres catégories
    document.querySelectorAll('.menu-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.cat;
        renderMenu();
      });
    });

    // Bouton "Nouveau plat"
    document.getElementById('menuAddBtn')?.addEventListener('click', () => openMenuModal(null));

    // Fermer modal
    document.getElementById('menuModalClose')?.addEventListener('click', closeMenuModal);
    document.getElementById('menuModalOverlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('menuModalOverlay')) closeMenuModal();
    });

    // Formulaire
    document.getElementById('menuForm')?.addEventListener('submit', saveMenuItem);

    // Supprimer
    document.getElementById('menuDeleteBtn')?.addEventListener('click', deleteMenuItem);
  });

  /* ══════════════════════════════════════════════════════
     RENDU DE LA GRILLE
  ══════════════════════════════════════════════════════ */
  function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    const filtered = currentCat === 'all'
      ? MENU_DATA
      : MENU_DATA.filter(p => p.cat === currentCat);

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state"><span>🍽️</span><p>Aucun plat dans cette catégorie.</p></div>';
      return;
    }

    // Grouper par catégorie si "all"
    if (currentCat === 'all') {
      const groups = {};
      filtered.forEach(p => {
        if (!groups[p.cat]) groups[p.cat] = [];
        groups[p.cat].push(p);
      });

      grid.innerHTML = Object.entries(groups).map(([cat, plats]) => `
        <div class="menu-cat-section">
          <h4 class="menu-cat-title">${CAT_LABELS[cat] || cat}</h4>
          <div class="menu-items-row">
            ${plats.map(p => renderCard(p)).join('')}
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = `<div class="menu-items-row">${filtered.map(p => renderCard(p)).join('')}</div>`;
    }

    // Events sur les cards
    grid.querySelectorAll('.menu-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        openMenuModal(id);
      });
    });
  }

  function renderCard(p) {
    return `
      <div class="menu-item-card ${!p.dispo ? 'indispo' : ''}" data-id="${p.id}">
        <div class="mic-top">
          <div class="mic-badges">
            ${p.chef ? '<span class="mic-badge chef">👨‍🍳 Spécialité</span>' : ''}
            ${p.new  ? '<span class="mic-badge new">✨ Nouveau</span>'       : ''}
            ${p.vege ? '<span class="mic-badge vege">🌿</span>'              : ''}
            ${!p.dispo ? '<span class="mic-badge indispo">Indisponible</span>' : ''}
          </div>
          <button class="mic-edit-btn" title="Modifier">✏️</button>
        </div>
        <div class="mic-body">
          <h4 class="mic-nom">${p.nom}</h4>
          <p class="mic-desc">${p.desc || ''}</p>
        </div>
        <div class="mic-footer">
          <span class="mic-prix">${p.prix}€</span>
          <span class="mic-cat">${CAT_LABELS[p.cat] || p.cat}</span>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     MODAL AJOUT / ÉDITION
  ══════════════════════════════════════════════════════ */
  function openMenuModal(id) {
    const overlay   = document.getElementById('menuModalOverlay');
    const titleEl   = document.getElementById('menuModalTitle');
    const deleteBtn = document.getElementById('menuDeleteBtn');

    if (id) {
      // Édition
      const p = MENU_DATA.find(x => x.id === id);
      if (!p) return;
      editingId = id;
      titleEl.textContent = '✏️ Modifier le plat';
      deleteBtn.style.display = 'block';

      document.getElementById('menuItemId').value   = id;
      document.getElementById('menuItemNom').value  = p.nom;
      document.getElementById('menuItemPrix').value = p.prix;
      document.getElementById('menuItemDesc').value = p.desc || '';
      document.getElementById('menuItemCat').value  = p.cat;
      document.getElementById('badgeVege').checked  = p.vege;
      document.getElementById('badgeChef').checked  = p.chef;
      document.getElementById('badgeNew').checked   = p.new;
      document.getElementById('badgeDispo').checked = p.dispo;
    } else {
      // Création
      editingId = null;
      titleEl.textContent = '+ Nouveau plat';
      deleteBtn.style.display = 'none';
      document.getElementById('menuForm').reset();
      document.getElementById('badgeDispo').checked = true;
    }

    overlay.classList.add('open');
    document.getElementById('menuItemNom').focus();
  }

  function closeMenuModal() {
    document.getElementById('menuModalOverlay')?.classList.remove('open');
    editingId = null;
  }

  /* ══════════════════════════════════════════════════════
     SAUVEGARDER
  ══════════════════════════════════════════════════════ */
  async function saveMenuItem(e) {
    e.preventDefault();

    const item = {
      nom:   document.getElementById('menuItemNom').value.trim(),
      prix:  parseFloat(document.getElementById('menuItemPrix').value),
      desc:  document.getElementById('menuItemDesc').value.trim(),
      cat:   document.getElementById('menuItemCat').value,
      vege:  document.getElementById('badgeVege').checked,
      chef:  document.getElementById('badgeChef').checked,
      new:   document.getElementById('badgeNew').checked,
      dispo: document.getElementById('badgeDispo').checked,
    };

    const sb = window.getSupabaseClient?.();

    if (editingId) {
      // Modifier
      item.id = editingId;

      if (sb && window.SUPABASE_CONFIGURED) {
        const { error } = await sb.from('menu_items').update(item).eq('id', editingId);
        if (error) { showToast('❌ Erreur : ' + error.message); return; }
      }

      const idx = MENU_DATA.findIndex(x => x.id === editingId);
      if (idx !== -1) MENU_DATA[idx] = item;
      showToast('✅ Plat modifié !');

    } else {
      // Créer
      item.id = nextId++;

      if (sb && window.SUPABASE_CONFIGURED) {
        const { data, error } = await sb.from('menu_items').insert(item).select().single();
        if (error) { showToast('❌ Erreur : ' + error.message); return; }
        item.id = data.id;
      }

      MENU_DATA.push(item);
      showToast('✅ Plat ajouté !');
    }

    closeMenuModal();
    renderMenu();
  }

  /* ══════════════════════════════════════════════════════
     SUPPRIMER
  ══════════════════════════════════════════════════════ */
  async function deleteMenuItem() {
    if (!editingId) return;
    if (!confirm('Supprimer ce plat définitivement ?')) return;

    const sb = window.getSupabaseClient?.();

    if (sb && window.SUPABASE_CONFIGURED) {
      const { error } = await sb.from('menu_items').delete().eq('id', editingId);
      if (error) { showToast('❌ Erreur : ' + error.message); return; }
    }

    MENU_DATA = MENU_DATA.filter(x => x.id !== editingId);
    showToast('🗑️ Plat supprimé.');
    closeMenuModal();
    renderMenu();
  }

  /* ── Toast ────────────────────────────────────────────── */
  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position:fixed;bottom:1.5rem;right:1.5rem;
      background:var(--deep);color:var(--white);
      padding:.75rem 1.25rem;border-radius:8px;
      font-size:.85rem;z-index:9999;
      animation:slideUp .3s ease;
      box-shadow:0 4px 20px rgba(0,0,0,.2);
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

})();
