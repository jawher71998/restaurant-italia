/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — notifications.js
   Notifications temps réel via Supabase Realtime
═══════════════════════════════════════════════════════ */

(function () {

  /* ── État ─────────────────────────────────────────── */
  let notifications = [];
  let unreadCount   = 0;
  let panelOpen     = false;

  /* ── Sons ─────────────────────────────────────────── */
  function playNotifSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain= ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════
     INIT — Injecter le panneau dans le DOM
  ══════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    injectNotifPanel();   // 1. Créer le panneau d'abord
    initNotifEvents();    // 2. Puis attacher les events
    renderList();         // 3. Afficher la liste vide
    startRealtimeListener();  // 4. Écouter Supabase Realtime
  });

  /* ── Injecter HTML du panneau ─────────────────────── */
  function injectNotifPanel() {
    const panel = document.createElement('div');
    panel.id    = 'notifPanel';
    panel.className = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-panel-header">
        <h4>🔔 Notifications</h4>
        <div class="notif-panel-actions">
          <button id="markAllRead">Tout lire</button>
          <button id="closeNotifPanel">✕</button>
        </div>
      </div>
      <div class="notif-list" id="notifList">
        <div class="notif-empty">Aucune notification</div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  /* ── Events ───────────────────────────────────────── */
  function initNotifEvents() {
    // Ouvrir/fermer le panneau
    document.getElementById('notifBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });

    // Fermer en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (panelOpen && !document.getElementById('notifPanel')?.contains(e.target)) {
        closePanel();
      }
    });

    // Marquer tout comme lu
    document.getElementById('markAllRead')?.addEventListener('click', markAllRead);

    // Fermer le panneau
    document.getElementById('closeNotifPanel')?.addEventListener('click', closePanel);
  }

  /* ── Ouvrir / Fermer panneau ──────────────────────── */
  function togglePanel() {
    panelOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    document.getElementById('notifPanel')?.classList.add('open');
    panelOpen = true;
    markAllRead();
  }

  function closePanel() {
    document.getElementById('notifPanel')?.classList.remove('open');
    panelOpen = false;
  }

  /* ── Marquer tout comme lu ────────────────────────── */
  function markAllRead() {
    notifications.forEach(n => n.read = true);
    unreadCount = 0;
    updateBadge();
    renderList();
  }

  /* ══════════════════════════════════════════════════
     AJOUTER UNE NOTIFICATION
  ══════════════════════════════════════════════════ */
  function addNotification(data) {
    const notif = {
      id:        Date.now(),
      type:      data.type || 'reservation',
      title:     data.title,
      body:      data.body,
      time:      new Date(),
      read:      false,
      resaId:    data.resaId || null,
    };

    notifications.unshift(notif); // Ajouter en tête
    if (notifications.length > 30) notifications.pop(); // Max 30

    unreadCount++;
    updateBadge();
    renderList();
    showToastNotif(notif);
    playNotifSound();
    animateBell();
  }

  /* ── Mettre à jour le badge ───────────────────────── */
  function updateBadge() {
    // Badge cloche header
    const dot = document.getElementById('notifDot');
    if (dot) {
      dot.style.display = unreadCount > 0 ? 'block' : 'none';
      dot.textContent   = unreadCount > 9 ? '9+' : (unreadCount > 0 ? String(unreadCount) : '');
    }

    // Badge sidebar Réservations
    const sidebarBadge = document.getElementById('badgeEnAttente');
    if (sidebarBadge) {
      if (unreadCount > 0) {
        sidebarBadge.textContent    = unreadCount;
        sidebarBadge.style.display  = 'inline-block';
      }
    }
  }

  /* ── Animer la cloche ─────────────────────────────── */
  function animateBell() {
    const btn = document.getElementById('notifBtn');
    if (!btn) return;
    btn.style.animation = 'none';
    requestAnimationFrame(() => {
      btn.style.animation = 'bellRing 0.6s ease';
    });
  }

  /* ── Rendu de la liste ────────────────────────────── */
  function renderList() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (!notifications.length) {
      list.innerHTML = '<div class="notif-empty">Aucune notification</div>';
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="notif-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
        <div class="notif-item-icon">${getNotifIcon(n.type)}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-text">${n.body}</div>
          <div class="notif-item-time">${formatTime(n.time)}</div>
        </div>
        ${n.resaId ? `<button class="notif-view-btn" onclick="openModal(${n.resaId})">Voir</button>` : ''}
      </div>
    `).join('');
  }

  /* ── Toast popup notification ─────────────────────── */
  function showToastNotif(notif) {
    const toast = document.createElement('div');
    toast.className = 'notif-toast';
    toast.innerHTML = `
      <div class="notif-toast-icon">${getNotifIcon(notif.type)}</div>
      <div class="notif-toast-content">
        <div class="notif-toast-title">${notif.title}</div>
        <div class="notif-toast-body">${notif.body}</div>
      </div>
      <button class="notif-toast-close">✕</button>
    `;
    document.body.appendChild(toast);

    // Apparition
    requestAnimationFrame(() => toast.classList.add('show'));

    // Fermer au clic
    toast.querySelector('.notif-toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    });

    // Auto-fermer après 5s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  /* ══════════════════════════════════════════════════
     SUPABASE REALTIME
  ══════════════════════════════════════════════════ */
  function startRealtimeListener() {
    const sb = window.getSupabaseClient?.();
    if (!sb || !window.SUPABASE_CONFIGURED) {
      console.log('🔔 Notifications : mode démo (Supabase non configuré)');
      return;
    }

    console.log('🔔 Supabase Realtime : en écoute...');

    sb
      .channel('reservations-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          const r = payload.new;
          addNotification({
            type:   'reservation',
            title:  '🍽️ Nouvelle réservation !',
            body:   `${r.prenom} ${r.nom} — ${r.couverts} pers. — ${r.date} à ${r.heure}`,
            resaId: r.id,
          });

          // Rafraîchir le tableau
          if (window.getAllReservations) {
            window.getAllReservations().then(data => {
              if (window.refreshCalendar) window.refreshCalendar(data);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations' },
        (payload) => {
          const r = payload.new;
          if (r.statut === 'annulee') {
            addNotification({
              type:  'annulation',
              title: '❌ Réservation annulée',
              body:  `${r.prenom} ${r.nom} — ${r.date} à ${r.heure}`,
              resaId: r.id,
            });
          }
        }
      )
      .subscribe();
  }

  /* ══════════════════════════════════════════════════
     DONNÉES DÉMO
  ══════════════════════════════════════════════════ */
  function addDemoNotifications() {
    // Désactivé — les vraies notifs viennent de Supabase Realtime
    renderList();
  }

  /* ── Simuler une vraie notification (pour démo) ───── */
  window.simulateNotification = function() {
    addNotification({
      type:   'reservation',
      title:  '🍽️ Nouvelle réservation !',
      body:   'Amira Bensaid — 6 pers. — Demain à 19:30',
      resaId: 3,
    });
  };

  /* ── Utilitaires ──────────────────────────────────── */
  function getNotifIcon(type) {
    const icons = {
      reservation: '🍽️',
      annulation:  '❌',
      info:        'ℹ️',
      warning:     '⚠️',
    };
    return icons[type] || '🔔';
  }

  function formatTime(date) {
    const now  = new Date();
    const diff = Math.floor((now - date) / 60000); // minutes
    if (diff < 1)  return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24)    return `Il y a ${h}h`;
    return date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  }

})();