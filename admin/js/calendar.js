/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — calendar.js
   Calendrier visuel des réservations par semaine
═══════════════════════════════════════════════════════ */

(function () {

  const JOURS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const JOURS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const SLOTS_MIDI = ['12:00','12:30','13:00','13:30','14:00','14:30'];
  const SLOTS_SOIR = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];

  let currentMonday = getMonday(new Date());
  let allData       = [];

  /* ── Init ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calPrev')?.addEventListener('click', () => {
      currentMonday.setDate(currentMonday.getDate() - 7);
      renderCalendar();
    });

    document.getElementById('calNext')?.addEventListener('click', () => {
      currentMonday.setDate(currentMonday.getDate() + 7);
      renderCalendar();
    });

    document.getElementById('calToday')?.addEventListener('click', () => {
      currentMonday = getMonday(new Date());
      renderCalendar();
    });

    // Charger quand on clique sur l'onglet Calendrier
    document.querySelector('[data-section="calendrier"]')?.addEventListener('click', () => {
      loadCalendarData();
    });
  });

  /* ── Charger données ────────────────────────────────── */
  async function loadCalendarData() {
    // Utiliser les données déjà chargées par dashboard.js si disponibles
    if (window.getAllReservations) {
      allData = await window.getAllReservations();
    } else {
      // Données démo directes
      allData = window.DEMO_RESERVATIONS || [];
    }
    renderCalendar();
  }

  /* ── Rendu du calendrier ────────────────────────────── */
  function renderCalendar() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;

    // Mettre à jour le label de la semaine
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    const label = document.getElementById('calWeekLabel');
    if (label) {
      label.textContent =
        formatDateShort(currentMonday) + ' — ' + formatDateShort(sunday);
    }

    // Construire la semaine (7 jours)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      return d;
    });

    const today = new Date().toISOString().split('T')[0];

    // HTML
    let html = '';

    // En-tête des jours
    html += '<div class="cal-header-row">';
    html += '<div class="cal-time-col"></div>';
    days.forEach((d, i) => {
      const dateStr  = d.toISOString().split('T')[0];
      const isToday  = dateStr === today;
      const resCount = allData.filter(r => r.date === dateStr && r.statut !== 'annulee').length;
      html += `
        <div class="cal-day-header ${isToday ? 'is-today' : ''}">
          <span class="cal-day-name">${JOURS[i]}</span>
          <span class="cal-day-num">${d.getDate()}</span>
          ${resCount > 0 ? `<span class="cal-day-badge">${resCount}</span>` : ''}
        </div>`;
    });
    html += '</div>';

    // ── SERVICE MIDI ──────────────────────────────────────
    html += renderServiceBlock('☀️ Midi', SLOTS_MIDI, 'midi', days, today);

    // ── SERVICE SOIR ──────────────────────────────────────
    html += renderServiceBlock('🌙 Soir', SLOTS_SOIR, 'soir', days, today);

    grid.innerHTML = html;

    // Attacher les events sur les blocs
    grid.querySelectorAll('.cal-resa-block').forEach(block => {
      block.addEventListener('click', () => {
        const id = parseInt(block.dataset.id);
        if (window.openModal) window.openModal(id);
      });
    });
  }

  function renderServiceBlock(label, slots, service, days, today) {
    let html = `
      <div class="cal-service-label">${label}</div>
      <div class="cal-service-block">`;

    slots.forEach(slot => {
      html += '<div class="cal-row">';
      html += `<div class="cal-time-col">${slot}</div>`;

      days.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const isToday = dateStr === today;

        // Réservations pour ce créneau
        const resa = allData.filter(r =>
          r.date === dateStr &&
          r.heure === slot &&
          r.service === service
        );

        html += `<div class="cal-cell ${isToday ? 'is-today' : ''}">`;

        resa.forEach(r => {
          html += `
            <div class="cal-resa-block ${r.statut}" data-id="${r.id}" title="${r.prenom} ${r.nom} — ${r.couverts} pers.">
              <span class="cal-resa-name">${r.prenom} ${r.nom.charAt(0)}.</span>
              <span class="cal-resa-guests">👥${r.couverts}</span>
            </div>`;
        });

        html += '</div>';
      });

      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /* ── Utilitaires ────────────────────────────────────── */
  function getMonday(date) {
    const d   = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // Exposer pour être appelé par dashboard.js
  window.loadCalendarData  = loadCalendarData;
  window.refreshCalendar   = function(data) {
    allData = data;
    renderCalendar();
  };

})();
