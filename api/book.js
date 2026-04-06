/**
 * POST /api/book
 * Body: { checkin, checkout, guests, nombre, whatsapp, correo, mensaje }
 * Returns: { success: true, ref: "BP-XXXXXX" }
 *
 * Required environment variables (same as availability.js):
 *   GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID
 *
 * For the service account, share the calendar with "Make changes to events" role.
 */

const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'bambuparadiso@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { checkin, checkout, guests, nombre, whatsapp, correo, mensaje } = req.body || {};
  if (!checkin || !checkout || !nombre || !whatsapp || !correo) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const ref = 'BP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const guestsNum = parseInt(guests, 10) || 1;

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `[SOLICITUD PENDIENTE] ${nombre} — ${guestsNum} huésped${guestsNum > 1 ? 'es' : ''}`,
        description: [
          '⚠️  SOLICITUD PENDIENTE DE APROBACIÓN',
          '',
          `Ref:       ${ref}`,
          `Nombre:    ${nombre}`,
          `WhatsApp:  ${whatsapp}`,
          `Correo:    ${correo}`,
          `Huéspedes: ${guestsNum}`,
          mensaje ? `Mensaje:   ${mensaje}` : '',
          '',
          '─────────────────────────────────',
          'Pendiente de confirmación por el propietario.',
          'Una vez confirmado, cambia el estado del evento a "Confirmado".',
        ].filter(Boolean).join('\n'),
        start:        { date: checkin },
        end:          { date: checkout },
        status:       'tentative',   // shows as "pending" in Google Calendar
        colorId:      '5',           // banana yellow = awaiting action
        transparency: 'opaque',      // blocks the time as busy
      },
    });

    return res.json({ success: true, ref });

  } catch (err) {
    console.error('booking error:', err.message);
    return res.status(500).json({ error: 'Booking failed' });
  }
};
