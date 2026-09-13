/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — dashboard.js
   Stats · Réservations · Clients · Navigation
═══════════════════════════════════════════════════════ */

/* ── Données démo (si Supabase pas configuré) ─────────── */
const DEMO_DATA = [
  { id:1, ref:'LTR-847291', created_at:'2026-09-11T10:23:00Z', date:'2026-09-11', heure:'20:00', service:'soir',  couverts:4, prenom:'Sophie',  nom:'Martin',  email:'sophie.martin@gmail.com',  tel:'+33 6 12 34 56 78', occasion:'birthday',    allergies:'Noix',       message:'Anniversaire de ma fille',   statut:'en_attente',  note_admin:'' },
  { id:2, ref:'LTR-392847', created_at:'2026-09-11T09:10:00Z', date:'2026-09-11', heure:'12:30', service:'midi',  couverts:2, prenom:'Marc',    nom:'Dupont',  email:'marc.dupont@hotmail.fr',   tel:'+33 6 98 76 54 32', occasion:'business',   allergies:'',           message:'Repas client important',     statut:'confirmee',   note_admin:'Table fenêtre' },
  { id:3, ref:'LTR-573920', created_at:'2026-09-10T18:45:00Z', date:'2026-09-12', heure:'19:30', service:'soir',  couverts:6, prenom:'Amira',   nom:'Bensaid', email:'amira.b@gmail.com',        tel:'+33 7 45 23 87 61', occasion:'family',     allergies:'Gluten',     message:'',                           statut:'en_attente',  note_admin:'' },
  { id:4, ref:'LTR-102938', created_at:'2026-09-10T14:20:00Z', date:'2026-09-13', heure:'20:30', service:'soir',  couverts:2, prenom:'Lucas',   nom:'Bernard', email:'lucas.bernard@orange.fr',  tel:'+33 6 33 44 55 66', occasion:'anniversary','allergies':'',         message:'Anniversaire de mariage',    statut:'confirmee',   note_admin:'' },
  { id:5, ref:'LTR-667834', created_at:'2026-09-09T11:00:00Z', date:'2026-09-10', heure:'12:00', service:'midi',  couverts:3, prenom:'Yasmine', nom:'Khelif',  email:'yasmine.k@gmail.com',      tel:'+33 6 77 88 99 00', occasion:'',           allergies:'Lactose',    message:'',                           statut:'annulee',     note_admin:'Annulé par client' },
  { id:6, ref:'LTR-445521', created_at:'2026-09-09T09:30:00Z', date:'2026-09-14', heure:'13:00', service:'midi',  couverts:8, prenom:'Pierre',  nom:'Lefebvre',email:'p.lefebvre@entreprise.fr', tel:'+33 1 42 33 44 55', occasion:'business',   allergies:'',           message:'Déjeuner équipe 8 personnes',statut:'en_attente',  note_admin:'' },
  { id:7, ref:'LTR-889012', created_at:'2026-09-08T20:15:00Z', date:'2026-09-15', heure:'20:00', service:'soir',  couverts:2, prenom:'Nadia',   nom:'Rousseau',email:'nadia.r@free.fr',          tel:'+33 6 55 44 33 22', occasion:'date',       allergies:'',           message:'Dîner romantique',           statut:'confirmee',   note_admin:'Fleurs commandées' },
];

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboard();
  loadReservations();
  loadClients();
  initModal();
});

/* ══════════════════════════════════════════════════════
   1. NAVIGATION SIDEBAR
══════════════════════════════════════════════════════ */
function initNavigation() {
  const links    = document.querySelectorAll('.snav');
  const sections = document.querySelectorAll('.dash-section');
  const title    = document.getElementById('dashTitle');

  const labels = {
    dashboard:    'Dashboard',
    reservations: 'Réservations',
    clients:      'Clients',
    menu:         'Éditeur de Menu',
  };

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;

      links.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      link.classList.add('active');
      document.getElementById('section-' + target)?.classList.add('active');
      if (title) title.textContent = labels[target] || target;

      // Fermer sidebar mobile
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });

  // Refresh dashboard
  document.getElementById('refreshDashboard')?.addEventListener('click', loadDashboard);
}

/* ══════════════════════════════════════════════════════
   2. CHARGER LES DONNÉES
══════════════════════════════════════════════════════ */
async function fetchReservations() {
  const sb = window.getSupabaseClient?.();

  if (!sb || !window.SUPABASE_CONFIGURED) {
    return DEMO_DATA;
  }

  const { data, error } = await sb
    .from('reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('heure', { ascending: true });

  if (error) { console.error(error); return DEMO_DATA; }
  return data || [];
}

/* ══════════════════════════════════════════════════════
   3. DASHBOARD — Stats + listes
══════════════════════════════════════════════════════ */
async function loadDashboard() {
  const all   = await fetchReservations();
  const today = new Date().toISOString().split('T')[0];

  const todayRes    = all.filter(r => r.date === today);
  const enAttente   = all.filter(r => r.statut === 'en_attente');
  const couvertsSoir= todayRes.filter(r => r.service === 'soir' && r.statut !== 'annulee')
                              .reduce((s, r) => s + r.couverts, 0);

  // Semaine en cours
  const monday = getMondayOfWeek();
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const semaineRes = all.filter(r => {
    const d = new Date(r.date);
    return d >= monday && d <= sunday && r.statut !== 'annulee';
  });

  // Afficher stats
  setText('statAujourdhui', todayRes.filter(r => r.statut !== 'annulee').length);
  setText('statEnAttente',  enAttente.length);
  setText('statCouverts',   couvertsSoir);
  setText('statSemaine',    semaineRes.length);
  setText('badgeEnAttente', enAttente.length);

  // Badge notification
  const notifDot = document.getElementById('notifDot');
  if (notifDot) notifDot.style.display = enAttente.length > 0 ? 'block' : 'none';

  // Liste du jour
  renderTodayList(todayRes);

  // Prochaines
  const upcoming = all
    .filter(r => r.date > today && r.statut !== 'annulee')
    .slice(0, 5);
  renderUpcomingList(upcoming);
}

function renderTodayList(items) {
  const el = document.getElementById('todayList');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><span>🍽️</span><p>Aucune réservation aujourd\'hui.</p></div>';
    return;
  }

  el.innerHTML = items.map(r => `
    <div class="resa-row ${r.statut}" data-id="${r.id}" onclick="openModal(${r.id})">
      <span class="resa-time">${r.heure}</span>
      <div class="resa-info">
        <div class="resa-name">${r.prenom} ${r.nom}</div>
        <div class="resa-meta">${r.ref} · ${r.service === 'midi' ? '☀️ Midi' : '🌙 Soir'}${r.occasion ? ' · ' + getOccasionLabel(r.occasion) : ''}</div>
      </div>
      <span class="resa-guests">👥 ${r.couverts}</span>
      <span class="statut-badge ${r.statut}">${getStatutLabel(r.statut)}</span>
    </div>
  `).join('');
}

function renderUpcomingList(items) {
  const el = document.getElementById('upcomingList');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><p>Aucune réservation à venir.</p></div>';
    return;
  }

  el.innerHTML = items.map(r => `
    <div class="resa-row ${r.statut}" onclick="openModal(${r.id})">
      <span class="resa-time">${formatDate(r.date)}</span>
      <div class="resa-info">
        <div class="resa-name">${r.prenom} ${r.nom}</div>
        <div class="resa-meta">${r.heure} · ${r.couverts} pers.</div>
      </div>
      <span class="statut-badge ${r.statut}">${getStatutLabel(r.statut)}</span>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   4. TABLEAU RÉSERVATIONS
══════════════════════════════════════════════════════ */
let allReservations = [];
let currentFilter   = 'all';
let currentSearch   = '';

async function loadReservations() {
  allReservations = await fetchReservations();
  renderTable();
  initFilters();
}

function renderTable() {
  const tbody = document.getElementById('resTableBody');
  if (!tbody) return;

  let filtered = allReservations;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => r.statut === currentFilter);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(r =>
      r.prenom.toLowerCase().includes(q) ||
      r.nom.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.ref.toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Aucune réservation trouvée.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><code style="font-size:0.78rem;color:var(--terra);">${r.ref}</code></td>
      <td>
        <strong>${r.prenom} ${r.nom}</strong><br/>
        <span style="font-size:0.75rem;color:var(--text-light);">${r.email}</span>
      </td>
      <td>${formatDate(r.date)}</td>
      <td>${r.heure} <span style="color:var(--text-light);font-size:0.75rem;">${r.service === 'midi' ? '☀️' : '🌙'}</span></td>
      <td>👥 ${r.couverts}</td>
      <td><span class="statut-badge ${r.statut}">${getStatutLabel(r.statut)}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" onclick="openModal(${r.id})">👁️ Voir</button>
          ${r.statut !== 'confirmee' ? `<button class="action-btn confirm" onclick="updateStatut(${r.id},'confirmee')">✅</button>` : ''}
          ${r.statut !== 'annulee'   ? `<button class="action-btn cancel"  onclick="updateStatut(${r.id},'annulee')">❌</button>`  : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  document.getElementById('searchRes')?.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    renderTable();
  });
}

/* ══════════════════════════════════════════════════════
   5. CHANGER STATUT
══════════════════════════════════════════════════════ */
window.updateStatut = async function(id, newStatut) {
  const sb = window.getSupabaseClient?.();

  // Mode démo
  if (!sb || !window.SUPABASE_CONFIGURED) {
    const r = allReservations.find(r => r.id === id);
    if (r) r.statut = newStatut;
    renderTable();
    loadDashboard();
    closeModal();
    showToast(newStatut === 'confirmee' ? '✅ Réservation confirmée !' : '❌ Réservation annulée.');
    return;
  }

  const { error } = await sb
    .from('reservations')
    .update({ statut: newStatut })
    .eq('id', id);

  if (error) { showToast('❌ Erreur : ' + error.message); return; }

  // Mettre à jour localement
  const r = allReservations.find(r => r.id === id);
  if (r) r.statut = newStatut;

  renderTable();
  loadDashboard();
  closeModal();
  showToast(newStatut === 'confirmee' ? '✅ Réservation confirmée !' : '❌ Réservation annulée.');
};

/* ══════════════════════════════════════════════════════
   6. MODAL DÉTAIL
══════════════════════════════════════════════════════ */
function initModal() {
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

window.openModal = function(id) {
  const r = allReservations.find(r => r.id === id);
  if (!r) return;

  const body = document.getElementById('modalBody');
  const actions = document.getElementById('modalActions');

  body.innerHTML = `
    <div class="modal-grid">
      <div class="modal-item">
        <strong>Référence</strong>
        <span style="color:var(--terra);font-weight:600;">${r.ref}</span>
      </div>
      <div class="modal-item">
        <strong>Statut</strong>
        <span class="statut-badge ${r.statut}">${getStatutLabel(r.statut)}</span>
      </div>
      <div class="modal-item">
        <strong>Client</strong>
        <span>${r.prenom} ${r.nom}</span>
      </div>
      <div class="modal-item">
        <strong>Téléphone</strong>
        <span><a href="tel:${r.tel}" style="color:var(--terra);">${r.tel}</a></span>
      </div>
      <div class="modal-item full">
        <strong>Email</strong>
        <span><a href="mailto:${r.email}" style="color:var(--terra);">${r.email}</a></span>
      </div>
      <div class="modal-item">
        <strong>Date</strong>
        <span>${formatDate(r.date)}</span>
      </div>
      <div class="modal-item">
        <strong>Heure & Service</strong>
        <span>${r.heure} · ${r.service === 'midi' ? '☀️ Midi' : '🌙 Soir'}</span>
      </div>
      <div class="modal-item">
        <strong>Couverts</strong>
        <span>👥 ${r.couverts} personne${r.couverts > 1 ? 's' : ''}</span>
      </div>
      <div class="modal-item">
        <strong>Occasion</strong>
        <span>${r.occasion ? getOccasionLabel(r.occasion) : 'Aucune'}</span>
      </div>
      ${r.allergies ? `<div class="modal-item full"><strong>Allergies / Régimes</strong><span>⚠️ ${r.allergies}</span></div>` : ''}
      ${r.message   ? `<div class="modal-item full"><strong>Message</strong><span>${r.message}</span></div>` : ''}
      <div class="modal-item">
        <strong>Réservé le</strong>
        <span>${new Date(r.created_at).toLocaleString('fr-FR')}</span>
      </div>
    </div>
  `;

  actions.innerHTML = `
    ${r.statut !== 'confirmee' ? `<button class="modal-btn confirm" onclick="updateStatut(${r.id},'confirmee')">✅ Confirmer</button>` : ''}
    ${r.statut !== 'annulee'   ? `<button class="modal-btn cancel"  onclick="updateStatut(${r.id},'annulee')">❌ Annuler</button>`   : ''}
  `;

  document.getElementById('modalOverlay').classList.add('open');
};

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
}

/* ══════════════════════════════════════════════════════
   7. CLIENTS AVANCÉS
══════════════════════════════════════════════════════ */
let allClients = [];
let clientSearch = '';

async function loadClients() {
  const all = await fetchReservations();

  // Grouper par email avec stats complètes
  const clientMap = {};
  all.forEach(r => {
    if (!clientMap[r.email]) {
      clientMap[r.email] = {
        prenom: r.prenom, nom: r.nom,
        email: r.email, tel: r.tel,
        reservations: [],
        lastDate: r.date,
        totalCouverts: 0,
      };
    }
    clientMap[r.email].reservations.push(r);
    if (r.statut !== 'annulee') {
      clientMap[r.email].totalCouverts += r.couverts;
    }
    if (r.date > clientMap[r.email].lastDate) {
      clientMap[r.email].lastDate = r.date;
    }
  });

  allClients = Object.values(clientMap).sort((a, b) =>
    b.reservations.length - a.reservations.length
  );

  setText('clientCount', allClients.length + ' client' + (allClients.length > 1 ? 's' : ''));

  // Ajouter la recherche clients
  const searchEl = document.getElementById('searchClients');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      clientSearch = e.target.value.trim().toLowerCase();
      renderClients();
    });
  }

  renderClients();
}

function renderClients() {
  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;

  let filtered = allClients;
  if (clientSearch) {
    filtered = allClients.filter(c =>
      c.prenom.toLowerCase().includes(clientSearch) ||
      c.nom.toLowerCase().includes(clientSearch) ||
      c.email.toLowerCase().includes(clientSearch) ||
      c.tel.includes(clientSearch)
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Aucun client trouvé.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const isVip      = c.reservations.length >= 3;
    const confirmed  = c.reservations.filter(r => r.statut === 'confirmee').length;
    const cancelled  = c.reservations.filter(r => r.statut === 'annulee').length;

    return `
      <tr class="client-row" style="cursor:pointer;" onclick="openClientModal('${c.email}')">
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div class="client-avatar">${c.prenom.charAt(0)}${c.nom.charAt(0)}</div>
            <div>
              <strong>${c.prenom} ${c.nom}</strong>
              ${isVip ? '<span class="vip-badge">⭐ VIP</span>' : ''}
            </div>
          </div>
        </td>
        <td><a href="mailto:${c.email}" style="color:var(--terra);" onclick="event.stopPropagation()">${c.email}</a></td>
        <td><a href="tel:${c.tel}" onclick="event.stopPropagation()">${c.tel}</a></td>
        <td>
          <span class="count-pill">${c.reservations.length} résa</span>
          ${confirmed > 0 ? `<span class="count-pill success">${confirmed} ✅</span>` : ''}
          ${cancelled > 0 ? `<span class="count-pill danger">${cancelled} ❌</span>` : ''}
        </td>
        <td>👥 ${c.totalCouverts} couverts</td>
        <td>${formatDate(c.lastDate)}</td>
      </tr>
    `;
  }).join('');
}

// Modal historique client
window.openClientModal = function(email) {
  const c = allClients.find(c => c.email === email);
  if (!c) return;

  const isVip = c.reservations.length >= 3;
  const body  = document.getElementById('modalBody');
  const actions = document.getElementById('modalActions');

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--cream-dark);">
      <div class="client-avatar large">${c.prenom.charAt(0)}${c.nom.charAt(0)}</div>
      <div>
        <h4 style="font-size:1.1rem;margin-bottom:0.2rem;">
          ${c.prenom} ${c.nom}
          ${isVip ? '<span class="vip-badge">⭐ VIP</span>' : ''}
        </h4>
        <div style="font-size:0.82rem;color:var(--text-light);">
          <a href="mailto:${c.email}" style="color:var(--terra);">${c.email}</a> · 
          <a href="tel:${c.tel}">${c.tel}</a>
        </div>
      </div>
    </div>

    <div class="client-stats-row">
      <div class="client-stat">
        <span>${c.reservations.length}</span>
        <small>Réservations</small>
      </div>
      <div class="client-stat">
        <span>${c.totalCouverts}</span>
        <small>Couverts total</small>
      </div>
      <div class="client-stat">
        <span>${c.reservations.filter(r => r.statut === 'confirmee').length}</span>
        <small>Confirmées</small>
      </div>
      <div class="client-stat">
        <span>${c.reservations.filter(r => r.statut === 'annulee').length}</span>
        <small>Annulées</small>
      </div>
    </div>

    <h5 style="font-size:0.8rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);margin:1rem 0 0.5rem;">
      Historique des réservations
    </h5>
    <div class="client-history">
      ${c.reservations.sort((a,b) => b.date.localeCompare(a.date)).map(r => `
        <div class="history-row ${r.statut}" onclick="openModal(${r.id})">
          <span class="history-date">${formatDate(r.date)}</span>
          <span>${r.heure} · ${r.service === 'midi' ? '☀️' : '🌙'} · 👥${r.couverts}</span>
          <span class="statut-badge ${r.statut}" style="font-size:0.7rem;">${getStatutLabel(r.statut)}</span>
        </div>
      `).join('')}
    </div>
  `;

  actions.innerHTML = `
    <a href="mailto:${c.email}" class="modal-btn confirm" style="text-align:center;text-decoration:none;">
      ✉️ Envoyer un email
    </a>
    <a href="tel:${c.tel}" class="modal-btn" style="background:var(--terra);color:#fff;text-align:center;text-decoration:none;">
      📞 Appeler
    </a>
  `;

  document.getElementById('modalOverlay').classList.add('open');
};


/* ══════════════════════════════════════════════════════
   8. TOAST NOTIFICATION
══════════════════════════════════════════════════════ */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:1.5rem; right:1.5rem;
    background:var(--deep); color:var(--white);
    padding:0.75rem 1.25rem; border-radius:8px;
    font-size:0.85rem; z-index:999;
    animation:slideUp 0.3s ease;
    box-shadow:0 4px 20px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ══════════════════════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function getMondayOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0,0,0,0);
  return d;
}

function getStatutLabel(s) {
  return { en_attente:'⏳ En attente', confirmee:'✅ Confirmée', annulee:'❌ Annulée' }[s] || s;
}

function getOccasionLabel(o) {
  return { anniversary:'💑 Couple', birthday:'🎂 Anniversaire', business:'💼 Affaires', family:'👨‍👩‍👧 Famille', date:'💕 Romantique', other:'✨ Autre' }[o] || o;
}

/* ══════════════════════════════════════════════════════
   EXPOSER POUR CALENDAR.JS
══════════════════════════════════════════════════════ */
window.DEMO_RESERVATIONS  = DEMO_DATA;
window.getAllReservations  = fetchReservations;
