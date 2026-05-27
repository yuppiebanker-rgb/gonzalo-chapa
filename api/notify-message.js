// Required Vercel environment variables:
//   RESEND_API_KEY — get from https://resend.com (free tier: 3,000 emails/month)

const { Resend } = require('resend');

const TO = 'gchapa2602@gmail.com';
const FROM = 'noreply@gchapa.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, message } = req.body || {};

  if (!name || !email) return res.status(400).json({ error: 'Missing required fields' });

  const subject = `Nuevo Mensaje — ${name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #0b0906; color: #f4efe6; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 0.5px solid rgba(192,164,110,0.4); padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-family: Georgia, serif; font-style: italic; font-size: 28px; font-weight: 300;
                 color: #c0a46e; margin: 0 0 6px; }
    .header p  { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
                 color: rgba(244,239,230,0.4); margin: 0; }
    .field { margin-bottom: 20px; }
    .field .label { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
                    color: #c0a46e; display: block; margin-bottom: 4px; }
    .field .value { font-size: 15px; color: #f4efe6; line-height: 1.6; }
    .message-box { background: rgba(244,239,230,0.05); border: 0.5px solid rgba(192,164,110,0.2);
                   padding: 16px 20px; margin-top: 28px; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 0.5px solid rgba(244,239,230,0.1);
              font-size: 11px; color: rgba(244,239,230,0.3); text-align: center; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Nuevo Mensaje</h1>
    <p>Gonzalo Chapa &mdash; gchapa.com</p>
  </div>

  <div class="field">
    <span class="label">Nombre</span>
    <span class="value">${name}</span>
  </div>
  <div class="field">
    <span class="label">Email</span>
    <span class="value"><a href="mailto:${email}" style="color:#c0a46e;text-decoration:none">${email}</a></span>
  </div>
  ${phone ? `<div class="field"><span class="label">Teléfono</span><span class="value">${phone}</span></div>` : ''}

  <div class="message-box">
    <span class="label">Mensaje</span>
    <div class="value" style="margin-top:8px;white-space:pre-wrap">${message || '—'}</div>
  </div>

  <div class="footer">
    Responde directo a <a href="mailto:${email}" style="color:#c0a46e">${email}</a>
  </div>
</div>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY) {
    console.log('[notify-message] RESEND_API_KEY not set — logging to console');
    console.log({ subject, to: TO, name, email, phone, message });
    return res.status(200).json({ ok: true, fallback: true });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      reply_to: email,
      subject,
      html
    });

    if (error) {
      console.error('[notify-message] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[notify-message] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
