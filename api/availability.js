/**
 * POST /api/availability
 * Body: { checkin: "YYYY-MM-DD", checkout: "YYYY-MM-DD" }
 * Returns: { available: boolean }
 *
 * Required environment variables (set in Vercel dashboard):
 *   GOOGLE_CLIENT_EMAIL  — service account email
 *   GOOGLE_PRIVATE_KEY   — service account private key (with literal \n)
 *   GOOGLE_CALENDAR_ID   — calendar to check (default: bambuparadiso@gmail.com)
 *
 * Setup:
 *   1. Google Cloud Console → create project → enable Calendar API
 *   2. IAM → Service Accounts → create → download JSON key
 *   3. Google Calendar → share bambuparadiso@gmail.com calendar with
 *      the service account email (role: "See all event details")
 *   4. Paste GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY into Vercel env vars
 */

const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'bambuparadiso@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { checkin, checkout } = req.body || {};
  if (!checkin || !checkout) {
    return res.status(400).json({ error: 'Missing checkin or checkout' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(checkin + 'T00:00:00').toISOString(),
        timeMax: new Date(checkout + 'T23:59:59').toISOString(),
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busySlots = (fb.data.calendars[CALENDAR_ID] || {}).busy || [];
    return res.json({ available: busySlots.length === 0 });

  } catch (err) {
    console.error('availability error:', err.message);
    return res.status(500).json({ error: 'Calendar check failed' });
  }
};
