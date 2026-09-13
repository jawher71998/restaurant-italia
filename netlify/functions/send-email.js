/* ═══════════════════════════════════════════════════════
   LA TAVOLA DI ROMA — send-email.js
   Netlify Function — Envoie 2 emails via Resend :
   1. Confirmation au client
   2. Notification au restaurant
═══════════════════════════════════════════════════════ */

const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const RESTAURANT_EMAIL  = 'contact@latavola.fr'; // email du restaurant
const RESTAURANT_NAME   = 'La Tavola di Roma';
const FROM_EMAIL        = 'onboarding@resend.dev'; // email expéditeur Resend gratuit

exports.handler = async (event) => {

  // Autoriser seulement les POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body);
    const { prenom, nom, email, tel, date, heure, service, couverts, occasion, allergies, message, ref } = data;

    // Formater la date
    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const serviceLabel  = service === 'midi' ? '☀️ Midi' : '🌙 Soir';
    const occasionLabels = {
      anniversary: '💑 Anniversaire de couple',
      birthday:    '🎂 Anniversaire',
      business:    '💼 Repas d\'affaires',
      family:      '👨‍👩‍👧 Repas en famille',
      date:        '💕 Dîner romantique',
      other:       '✨ Autre',
      '':          'Aucune',
    };

    /* ─── EMAIL 1 : CONFIRMATION AU CLIENT ──────────────── */
    const clientEmail = {
      from:    `${RESTAURANT_NAME} <${FROM_EMAIL}>`,
      to:      [email],
      subject: `✅ Votre réservation est confirmée — ${RESTAURANT_NAME}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0f0a 0%,#2a1208 100%);padding:40px 32px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:32px;color:#c9a84c;font-style:italic;margin-bottom:4px;">La Tavola</div>
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.5);">di Roma</div>
      <div style="width:40px;height:1px;background:#c9a84c;margin:16px auto;"></div>
      <div style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Confirmation de réservation</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;color:#1a0f0a;margin:0 0 8px;">Bonjour <strong>${prenom}</strong>,</p>
      <p style="font-size:14px;color:#6b5744;margin:0 0 24px;line-height:1.6;">
        Votre réservation au <strong>${RESTAURANT_NAME}</strong> est bien enregistrée. Nous avons hâte de vous accueillir !
      </p>

      <!-- Détails réservation -->
      <div style="background:#f5f0e8;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#c4622d;margin-bottom:12px;">
          Détails de votre réservation
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;width:40%;">Référence</td>
            <td style="padding:6px 0;font-size:13px;color:#1a0f0a;font-weight:700;">${ref}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;">Date</td>
            <td style="padding:6px 0;font-size:13px;color:#1a0f0a;font-weight:600;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;">Heure</td>
            <td style="padding:6px 0;font-size:13px;color:#1a0f0a;">${heure} · ${serviceLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;">Couverts</td>
            <td style="padding:6px 0;font-size:13px;color:#1a0f0a;">👥 ${couverts} personne${couverts > 1 ? 's' : ''}</td>
          </tr>
          ${occasion ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;">Occasion</td>
            <td style="padding:6px 0;font-size:13px;color:#1a0f0a;">${occasionLabels[occasion] || occasion}</td>
          </tr>` : ''}
          ${allergies ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b5744;">Régimes</td>
            <td style="padding:6px 0;font-size:13px;color:#c4622d;">⚠️ ${allergies}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Adresse -->
      <div style="border-left:3px solid #c9a84c;padding-left:16px;margin-bottom:24px;">
        <div style="font-size:13px;color:#1a0f0a;font-weight:600;margin-bottom:4px;">📍 Où nous trouver</div>
        <div style="font-size:13px;color:#6b5744;line-height:1.6;">
          12 Rue de la Paix, 75001 Paris<br>
          📞 +33 1 42 00 12 34
        </div>
      </div>

      <p style="font-size:13px;color:#6b5744;line-height:1.6;margin-bottom:24px;">
        Pour modifier ou annuler votre réservation, contactez-nous par téléphone ou répondez à cet email.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="https://latavola-roma.netlify.app" style="display:inline-block;background:#c4622d;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.05em;">
          Voir notre site →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1a0f0a;padding:20px 32px;text-align:center;">
      <div style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;">
        © 2026 ${RESTAURANT_NAME} · 12 Rue de la Paix, 75001 Paris
      </div>
    </div>
  </div>
</body>
</html>
      `,
    };

    /* ─── EMAIL 2 : NOTIFICATION AU RESTAURANT ──────────── */
    const restaurantEmail = {
      from:    `Réservations <${FROM_EMAIL}>`,
      to:      [RESTAURANT_EMAIL],
      subject: `🍽️ Nouvelle réservation — ${prenom} ${nom} — ${dateFormatted}`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:20px;border:1px solid #eee;border-radius:8px;">
  <h2 style="color:#c4622d;margin-top:0;">🍽️ Nouvelle réservation</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#666;width:40%;">Référence</td><td style="padding:6px 0;font-weight:700;color:#c4622d;">${ref}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Client</td><td style="padding:6px 0;font-weight:600;">${prenom} ${nom}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding:6px 0;color:#666;">Téléphone</td><td style="padding:6px 0;"><a href="tel:${tel}">${tel}</a></td></tr>
    <tr><td style="padding:6px 0;color:#666;">Date</td><td style="padding:6px 0;font-weight:600;">${dateFormatted}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Heure</td><td style="padding:6px 0;">${heure} · ${serviceLabel}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Couverts</td><td style="padding:6px 0;">👥 ${couverts}</td></tr>
    ${occasion ? `<tr><td style="padding:6px 0;color:#666;">Occasion</td><td style="padding:6px 0;">${occasionLabels[occasion]}</td></tr>` : ''}
    ${allergies ? `<tr><td style="padding:6px 0;color:#666;">⚠️ Allergies</td><td style="padding:6px 0;color:#e74c3c;font-weight:600;">${allergies}</td></tr>` : ''}
    ${message ? `<tr><td style="padding:6px 0;color:#666;">Message</td><td style="padding:6px 0;">${message}</td></tr>` : ''}
  </table>
  <div style="margin-top:16px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">
    Réservé le ${new Date().toLocaleString('fr-FR')}
  </div>
</div>
      `,
    };

    /* ─── ENVOYER LES 2 EMAILS ──────────────────────────── */
    const [res1, res2] = await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientEmail),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantEmail),
      }),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    if (!res1.ok) throw new Error('Client email failed: ' + JSON.stringify(data1));
    if (!res2.ok) throw new Error('Restaurant email failed: ' + JSON.stringify(data2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, clientEmailId: data1.id, restaurantEmailId: data2.id }),
    };

  } catch (err) {
    console.error('send-email error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
