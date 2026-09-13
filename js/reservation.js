/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — reservation.js
   Formulaire multi-étapes + Supabase + EmailJS
═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   ⚙️  CONFIGURATION — À personnaliser
   (voir SUPABASE_SETUP.md pour les étapes détaillées)
───────────────────────────────────────────────────────*/
const SUPABASE_CONFIG = {
  url:    'https://bamysqszusyionrqlqwg.supabase.co',    // ex: https://xyzxyz.supabase.co
  anonKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbXlzcXN6dXN5aW9ucnFscXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNjIyMTQsImV4cCI6MjEwNDczODIxNH0.dbKY81vAkW-AWbJdFb9pnGwOXIyKPR5WAt6urqiHrTE', // clé publique (safe côté client)
};

const EMAILJS_CONFIG = {
  publicKey:  'VOTRE_PUBLIC_KEY',
  serviceId:  'VOTRE_SERVICE_ID',
  templateId: 'VOTRE_TEMPLATE_ID',
};

/* ── Init Supabase client ──────────────────────────── */
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn('⚠️  Supabase SDK non chargé');
    return false;
  }
  if (SUPABASE_CONFIG.url === 'VOTRE_SUPABASE_URL') {
    console.warn('⚠️  Supabase : configurez vos clés dans SUPABASE_CONFIG');
    return false;
  }
  supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  console.log('✅ Supabase initialisé');
  return true;
}

(function init() {

  /* ── INIT ────────────────────────────────────────── */
  initSupabase();

  if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== 'VOTRE_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    console.log('✅ EmailJS initialisé');
  }

  /* ── ÉTAT GLOBAL ─────────────────────────────────── */
  const state = {
    step: 1, date: '', service: 'midi', time: '',
    guests: 2, occasion: '', prenom: '', nom: '',
    email: '', tel: '', allergies: '', message: '',
    ref: ''
  };

  const steps      = document.querySelectorAll('.form-step');
  const stepDots   = document.querySelectorAll('.step');
  const connectors = document.querySelectorAll('.step-connector');

  /* ══════════════════════════════════════════════════
     1. NAVIGATION MULTI-ÉTAPES
  ══════════════════════════════════════════════════ */
  function goToStep(n) {
    steps.forEach(s => s.classList.remove('active'));
    stepDots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i + 1 < n)  dot.classList.add('done');
      if (i + 1 === n) dot.classList.add('active');
    });
    connectors.forEach((c, i) => c.classList.toggle('done', i + 1 < n));
    document.getElementById('step' + n).classList.add('active');
    state.step = n;
    document.querySelector('.resa-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('next1').addEventListener('click', () => {
    if (validateStep1()) { buildRecap(); goToStep(2); }
  });

  document.getElementById('prev2').addEventListener('click', () => goToStep(1));

  /* ══════════════════════════════════════════════════
     2. BOUTON CONFIRMER — Supabase + EmailJS
  ══════════════════════════════════════════════════ */
  document.getElementById('next2').addEventListener('click', async () => {
    if (!validateStep2()) return;
    state.allergies = document.getElementById('resa-allergies').value.trim();
    state.message   = document.getElementById('resa-message').value.trim();

    // Générer le numéro de référence unique
    state.ref = 'LTR-' + Date.now().toString().slice(-6);

    setLoadingState(true);
    hideSendError();

    try {
      // 1. Sauvegarder dans Supabase (priorité)
      await saveToSupabase();

      // 2. Envoyer l'email (secondaire — échec silencieux)
      try {
        await sendReservationEmail();
      } catch (emailErr) {
        console.warn('EmailJS non critique :', emailErr);
      }

      // 3. Succès → confirmation
      buildConfirmation();
      goToStep(3);
      launchConfetti();

    } catch (err) {
      console.error('Erreur sauvegarde :', err);
      showSendError();
      // En mode démo (pas configuré) → on laisse passer quand même
      if (!supabaseClient) {
        setTimeout(() => {
          hideSendError();
          buildConfirmation();
          goToStep(3);
          launchConfetti();
        }, 1500);
      }
    } finally {
      setLoadingState(false);
    }
  });

  function setLoadingState(isLoading) {
    const btn       = document.getElementById('next2');
    const btnText   = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const prevBtn   = document.getElementById('prev2');
    btn.disabled     = isLoading;
    prevBtn.disabled = isLoading;
    if (btnText)   btnText.style.display  = isLoading ? 'none'  : 'inline';
    if (btnLoader) btnLoader.style.display = isLoading ? 'flex'  : 'none';
    btn.style.opacity = isLoading ? '0.8' : '1';
  }

  function showSendError() {
    const el = document.getElementById('sendError');
    if (el) el.style.display = 'flex';
  }

  function hideSendError() {
    const el = document.getElementById('sendError');
    if (el) el.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════
     3. SAUVEGARDE SUPABASE
  ══════════════════════════════════════════════════ */
  async function saveToSupabase() {
    // Mode démo — Supabase pas encore configuré
    if (!supabaseClient) {
      console.log('📦 [MODE DÉMO] Données qui seraient sauvegardées :', {
        ref:       state.ref,
        date:      state.date,
        heure:     state.time,
        service:   state.service,
        couverts:  state.guests,
        occasion:  state.occasion,
        prenom:    state.prenom,
        nom:       state.nom,
        email:     state.email,
        tel:       state.tel,
        allergies: state.allergies,
        message:   state.message,
        statut:    'en_attente',
      });
      await new Promise(r => setTimeout(r, 800)); // simuler délai réseau
      return;
    }

    // Vrai insert Supabase
    const { data, error } = await supabaseClient
      .from('reservations')
      .insert({
        ref:       state.ref,
        date:      state.date,
        heure:     state.time,
        service:   state.service,
        couverts:  state.guests,
        occasion:  state.occasion  || '',
        prenom:    state.prenom,
        nom:       state.nom,
        email:     state.email,
        tel:       state.tel,
        allergies: state.allergies || '',
        message:   state.message   || '',
        statut:    'en_attente',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Réservation sauvegardée :', data);
    return data;
  }

  /* ══════════════════════════════════════════════════
     4. ENVOI EMAIL VIA EMAILJS
  ══════════════════════════════════════════════════ */
  async function sendReservationEmail() {
    const occasionLabels = {
      anniversary: 'Anniversaire de couple', birthday: 'Anniversaire',
      business: "Repas d'affaires", family: 'Repas en famille',
      date: 'Dîner romantique', other: 'Autre', '': 'Aucune'
    };
    const dateFormatted = new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    if (EMAILJS_CONFIG.publicKey === 'VOTRE_PUBLIC_KEY') {
      console.log('📧 [MODE DÉMO] Email simulé');
      return;
    }

    return await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      client_prenom:    state.prenom,
      client_nom:       state.nom,
      client_email:     state.email,
      client_tel:       state.tel,
      client_allergies: state.allergies || 'Aucune',
      client_message:   state.message   || 'Aucun message',
      resa_ref:         state.ref,
      resa_date:        dateFormatted,
      resa_service:     state.service === 'midi' ? '☀️ Midi' : '🌙 Soir',
      resa_heure:       state.time,
      resa_couverts:    state.guests + ' personne' + (state.guests > 1 ? 's' : ''),
      resa_occasion:    occasionLabels[state.occasion] || 'Aucune',
      resa_timestamp:   new Date().toLocaleString('fr-FR'),
    });
  }

  /* ══════════════════════════════════════════════════
     5. COMPTEUR COUVERTS
  ══════════════════════════════════════════════════ */
  const guestCountEl = document.getElementById('guestCount');
  const guestMinus   = document.getElementById('guestMinus');
  const guestPlus    = document.getElementById('guestPlus');

  guestCountEl.style.transition = 'transform 0.2s ease, color 0.2s ease';

  function updateGuestUI() {
    guestCountEl.textContent  = state.guests;
    guestMinus.disabled       = state.guests <= 1;
    guestPlus.disabled        = state.guests >= 12;
    guestCountEl.style.transform = 'scale(1.3)';
    guestCountEl.style.color = 'var(--gold)';
    setTimeout(() => {
      guestCountEl.style.transform = 'scale(1)';
      guestCountEl.style.color = 'var(--terracotta)';
    }, 200);
  }

  guestMinus.addEventListener('click', () => { if (state.guests > 1)  { state.guests--; updateGuestUI(); } });
  guestPlus.addEventListener ('click', () => { if (state.guests < 12) { state.guests++; updateGuestUI(); } });

  /* ══════════════════════════════════════════════════
     6. SERVICE MIDI / SOIR
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('.service-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.service = btn.dataset.service;
      state.time = '';
      generateTimeSlots();
    });
  });

  /* ══════════════════════════════════════════════════
     7. CRÉNEAUX HORAIRES
  ══════════════════════════════════════════════════ */
  const SLOTS = {
    midi: ['12:00','12:30','13:00','13:30','14:00','14:30'],
    soir: ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30']
  };
  const UNAVAILABLE = ['13:00','20:30','21:30'];

  function generateTimeSlots() {
    const container = document.getElementById('timeSlots');
    container.innerHTML = '';
    SLOTS[state.service].forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.textContent = slot;
      btn.dataset.time = slot;
      if (UNAVAILABLE.includes(slot)) {
        btn.classList.add('unavailable');
        btn.title = 'Créneau complet';
      } else {
        btn.addEventListener('click', () => {
          state.time = slot;
          document.querySelectorAll('.time-slot').forEach(b => b.classList.toggle('selected', b.dataset.time === slot));
          document.getElementById('err-time').textContent = '';
        });
      }
      if (slot === state.time) btn.classList.add('selected');
      container.appendChild(btn);
    });
  }
  generateTimeSlots();

  /* ══════════════════════════════════════════════════
     8. DATE MINIMUM
  ══════════════════════════════════════════════════ */
  const dateInput = document.getElementById('resa-date');
  dateInput.min = new Date().toISOString().split('T')[0];
  dateInput.addEventListener('change', () => {
    state.date = dateInput.value;
    dateInput.classList.remove('invalid');
    document.getElementById('err-date').textContent = '';
  });

  /* ══════════════════════════════════════════════════
     9. OCCASIONS SPÉCIALES
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('.occasion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.occasion-btn').forEach(b => b.classList.remove('selected'));
      state.occasion = state.occasion === btn.dataset.occ ? '' : btn.dataset.occ;
      if (state.occasion) btn.classList.add('selected');
    });
  });

  /* ══════════════════════════════════════════════════
     10. VALIDATION
  ══════════════════════════════════════════════════ */
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function validateStep1() {
    let ok = true;
    if (!state.date) {
      showError('err-date', 'Veuillez choisir une date.');
      dateInput.classList.add('invalid');
      ok = false;
    }
    if (!state.time) {
      showError('err-time', 'Veuillez sélectionner un créneau horaire.');
      ok = false;
    }
    return ok;
  }

  function validateStep2() {
    let ok = true;
    const fields = [
      { id: 'resa-prenom', errId: 'err-prenom', key: 'prenom', test: v => v.trim().length >= 2, msg: 'Veuillez entrer votre prénom.' },
      { id: 'resa-nom',    errId: 'err-nom',    key: 'nom',    test: v => v.trim().length >= 2, msg: 'Veuillez entrer votre nom.' },
      { id: 'resa-email',  errId: 'err-email',  key: 'email',  test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Email invalide.' },
      { id: 'resa-tel',    errId: 'err-tel',    key: 'tel',    test: v => /^[\d\s\+\-\(\)]{7,}$/.test(v), msg: 'Numéro invalide.' },
    ];
    fields.forEach(({ id, errId, key, test, msg }) => {
      const val = document.getElementById(id).value.trim();
      state[key] = val;
      const input = document.getElementById(id);
      if (!test(val)) {
        showError(errId, msg);
        input.classList.add('invalid'); input.classList.remove('valid');
        ok = false;
      } else {
        showError(errId, '');
        input.classList.remove('invalid'); input.classList.add('valid');
      }
    });
    return ok;
  }

  // Validation live
  [
    ['resa-prenom','err-prenom', v => v.trim().length >= 2],
    ['resa-nom',   'err-nom',   v => v.trim().length >= 2],
    ['resa-email', 'err-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)],
    ['resa-tel',   'err-tel',   v => /^[\d\s\+\-\(\)]{7,}$/.test(v)],
  ].forEach(([id, errId, test]) => {
    document.getElementById(id).addEventListener('blur', function() {
      if (test(this.value)) {
        this.classList.remove('invalid'); this.classList.add('valid');
        showError(errId, '');
      } else if (this.value.trim()) {
        this.classList.add('invalid'); this.classList.remove('valid');
      }
    });
  });

  /* ══════════════════════════════════════════════════
     11. RÉCAPITULATIF
  ══════════════════════════════════════════════════ */
  function buildRecap() {
    const df = state.date
      ? new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
      : '—';
    const occLabels = { anniversary:'💑 Couple', birthday:'🎂 Anniversaire', business:'💼 Affaires', family:'👨‍👩‍👧 Famille', date:'💕 Romantique', other:'✨ Autre' };
    const items = [
      { label:'Date',    value: df },
      { label:'Service', value: state.service === 'midi' ? '☀️ Midi' : '🌙 Soir' },
      { label:'Heure',   value: state.time || '—' },
      { label:'Couverts',value: state.guests + ' personne' + (state.guests > 1 ? 's' : '') },
      ...(state.occasion ? [{ label:'Occasion', value: occLabels[state.occasion] }] : [])
    ];
    document.getElementById('recapGrid').innerHTML = items
      .map(i => '<div class="recap-item"><strong>' + i.label + '</strong><span>' + i.value + '</span></div>')
      .join('');
  }

  /* ══════════════════════════════════════════════════
     12. PAGE DE CONFIRMATION
  ══════════════════════════════════════════════════ */
  function buildConfirmation() {
    const df = new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    });
    const items = [
      { label:'Référence', value: state.ref, highlight: true },
      { label:'Nom',       value: state.prenom + ' ' + state.nom },
      { label:'Date',      value: df },
      { label:'Heure',     value: state.time + ' · ' + (state.service === 'midi' ? 'Midi' : 'Soir') },
      { label:'Couverts',  value: state.guests + ' personne' + (state.guests > 1 ? 's' : '') },
      { label:'Email',     value: state.email },
      { label:'Téléphone', value: state.tel },
      ...(state.allergies ? [{ label:'Régimes', value: state.allergies }] : []),
      ...(state.message   ? [{ label:'Message', value: state.message }]   : [])
    ];
    document.getElementById('confirmDetails').innerHTML = items
      .map(i => '<div class="confirm-item"><strong>' + i.label + '</strong><span' + (i.highlight ? ' class="highlight"' : '') + '>' + i.value + '</span></div>')
      .join('');
  }

  /* ══════════════════════════════════════════════════
     13. CONFETTI 🎉
  ══════════════════════════════════════════════════ */
  function launchConfetti() {
    const area = document.getElementById('confettiArea');
    const colors = ['#C4622D','#C9A84C','#E2C97E','#FFFFFF','#9E3F15','#F5F0E8'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = [
        'left:' + (Math.random() * 100) + '%',
        'background:' + colors[Math.floor(Math.random() * colors.length)],
        'width:' + (6 + Math.random() * 8) + 'px',
        'height:' + (6 + Math.random() * 8) + 'px',
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px'),
        'animation-duration:' + (0.8 + Math.random() * 1.2) + 's',
        'animation-delay:' + (Math.random() * 0.5) + 's',
      ].join(';');
      area.appendChild(p);
    }
    setTimeout(() => { area.innerHTML = ''; }, 3000);
  }

  console.log('🍕 Reservation + Supabase + EmailJS — prêt!');
})();
