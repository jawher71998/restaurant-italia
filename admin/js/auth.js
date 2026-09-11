/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — auth.js
   Gestion login / logout Supabase Auth
═══════════════════════════════════════════════════════ */

const SUPABASE_URL  = 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON = 'VOTRE_SUPABASE_ANON_KEY';

// ⚠️ FIX : ne créer le client QUE si les vraies clés sont là
const IS_DEMO = (SUPABASE_URL === 'VOTRE_SUPABASE_URL');

let _supabase = null;
function getClient() {
  if (IS_DEMO) return null; // mode démo → pas de client Supabase
  if (!_supabase && typeof supabase !== 'undefined') {
    try {
      _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    } catch(e) {
      console.warn('Supabase init failed:', e);
      return null;
    }
  }
  return _supabase;
}

const isLoginPage     = document.body.classList.contains('login-body');
const isDashboardPage = document.body.classList.contains('dashboard-body');

/* ══════════════════════════════════════════════════════
   PAGE LOGIN
══════════════════════════════════════════════════════ */
if (isLoginPage) {

  // Si déjà connecté (Supabase réel) → dashboard direct
  if (!IS_DEMO) {
    (async () => {
      const sb = getClient();
      if (!sb) return;
      const { data: { session } } = await sb.auth.getSession();
      if (session) window.location.href = 'dashboard.html';
    })();
  }

  const form       = document.getElementById('loginForm');
  const emailInput = document.getElementById('adminEmail');
  const pwInput    = document.getElementById('adminPassword');
  const btnText    = document.getElementById('loginBtnText');
  const btnLoader  = document.getElementById('loginBtnLoader');
  const errorBox   = document.getElementById('loginError');
  const errorMsg   = document.getElementById('loginErrorMsg');
  const togglePw   = document.getElementById('togglePw');

  // Toggle afficher/masquer mot de passe
  togglePw.addEventListener('click', () => {
    const isHidden   = pwInput.type === 'password';
    pwInput.type     = isHidden ? 'text' : 'password';
    togglePw.textContent = isHidden ? '🙈' : '👁️';
  });

  // Soumission formulaire
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = pwInput.value;

    // UI → état loading
    btnText.style.display   = 'none';
    btnLoader.style.display = 'inline';
    document.getElementById('loginBtn').disabled = true;
    errorBox.classList.remove('show');

    // ── MODE DÉMO ───────────────────────────────────────
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 900));

      if (email && password.length >= 6) {
        sessionStorage.setItem('admin_demo',  'true');
        sessionStorage.setItem('admin_email', email);
        window.location.href = 'dashboard.html';
      } else {
        showError('Mot de passe trop court — minimum 6 caractères.');
        resetBtn();
      }
      return;
    }

    // ── MODE RÉEL (Supabase configuré) ──────────────────
    try {
      const sb = getClient();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message
      );
      resetBtn();
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.add('show');
  }

  function resetBtn() {
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
    document.getElementById('loginBtn').disabled = false;
  }
}

/* ══════════════════════════════════════════════════════
   PAGE DASHBOARD — vérification session
══════════════════════════════════════════════════════ */
if (isDashboardPage) {

  (async () => {
    const isDemo    = IS_DEMO || sessionStorage.getItem('admin_demo') === 'true';
    const demoEmail = sessionStorage.getItem('admin_email') || 'admin@latavola.fr';

    if (isDemo) {
      initDashboardUI(demoEmail, demoEmail.split('@')[0]);
      return;
    }

    // Vérifier session Supabase réelle
    const sb = getClient();
    if (!sb) {
      initDashboardUI('admin@latavola.fr', 'Admin');
      return;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }

    initDashboardUI(session.user.email, session.user.email.split('@')[0]);
  })();

  function initDashboardUI(email, name) {
    const emailEl = document.getElementById('adminEmail');
    const nameEl  = document.getElementById('adminName');
    if (emailEl) emailEl.textContent = email;
    if (nameEl)  nameEl.textContent  = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Déconnexion
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    sessionStorage.removeItem('admin_demo');
    sessionStorage.removeItem('admin_email');
    if (!IS_DEMO) {
      const sb = getClient();
      if (sb) await sb.auth.signOut();
    }
    window.location.href = 'index.html';
  });

  // Burger mobile
  document.getElementById('burgerAdmin')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Date header
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}

// Exposer pour dashboard.js
window.getSupabaseClient    = getClient;
window.SUPABASE_CONFIGURED  = !IS_DEMO;
