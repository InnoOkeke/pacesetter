/**
 * Netlify Function v2: Pacesetters G-Travels Limited Contact & Dispatch Handler
 * Sends branded dispatch emails via Resend REST API with zero npm dependencies.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendResendEmail(apiKey, emailPayload) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.name || `Resend error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function buildRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:600;width:165px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;vertical-align:top;">${value}</td>
    </tr>
  `;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON request body' }, 400);
  }

  const refCode = String(body.refCode || `PGT-${Math.floor(100000 + Math.random() * 900000)}`).trim();
  const fullName = String(body.fullName || '').trim();
  const org = String(body.org || 'Private / Corporate').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const service = String(body.service || '').trim();
  const hub = String(body.hub || '').trim();
  const vehicle = String(body.vehicle || 'Operations Recommended').trim();
  const date = String(body.date || 'Flexible / Immediate').trim();
  const notes = String(body.notes || 'Standard protocol').trim();
  const website = String(body.website || '').trim();

  // Honeypot spam trap: return success silently without sending emails
  if (website.length > 0) {
    return jsonResponse({ ok: true, refCode }, 200);
  }

  if (!fullName || !email || !phone || !service || !hub) {
    return jsonResponse({ ok: false, error: 'Please complete all required booking fields.' }, 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse({ ok: false, error: 'Please provide a valid email address.' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'Email service is not configured yet.' }, 500);
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'Pacesetters G-Travels <css@pacesetterstravel.com>';
  const toEmail = process.env.RESEND_TO_EMAIL || 'css@pacesetterstravel.com';

  const cleanPhoneHref = phone.replace(/[^+\d]/g, '');
  const waSummary = encodeURIComponent(
    `Hello ${fullName}, we received your Pacesetters G-Travels protocol request (${refCode}) for ${service} in ${hub}.`
  );
  const waClientDigits = cleanPhoneHref.replace(/^\+/, '');

  const dispatchHtml = `
    <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;padding:28px 16px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#0b0f14;padding:24px 28px;border-bottom:3px solid #0e9b78;">
          <div style="color:#14b88e;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">24/7 Operations Dispatch</div>
          <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">New Protocol Request (${escapeHtml(refCode)})</h1>
        </div>
        <div style="padding:24px 28px;">
          <table style="width:100%;border-collapse:collapse;">
            ${buildRow('Reference', `<strong>${escapeHtml(refCode)}</strong>`)}
            ${buildRow('Principal / Contact', escapeHtml(fullName))}
            ${buildRow('Organization', escapeHtml(org))}
            ${buildRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#0a7a5e;text-decoration:none;font-weight:600;">${escapeHtml(email)}</a>`)}
            ${buildRow('Phone / WhatsApp', `<a href="tel:${escapeHtml(cleanPhoneHref)}" style="color:#0a7a5e;text-decoration:none;font-weight:600;">${escapeHtml(phone)}</a>`)}
            ${buildRow('Service Required', `<strong>${escapeHtml(service)}</strong>`)}
            ${buildRow('Operational Hub', escapeHtml(hub))}
            ${buildRow('Preferred Fleet', escapeHtml(vehicle))}
            ${buildRow('Target Date', escapeHtml(date))}
            ${buildRow('Notes', escapeHtml(notes).replace(/\n/g, '<br>'))}
          </table>
          ${
            waClientDigits
              ? `<div style="margin-top:22px;">
                  <a href="https://wa.me/${escapeHtml(waClientDigits)}?text=${waSummary}" style="display:inline-block;background:#0e9b78;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:13px;font-weight:600;">Reply to Client on WhatsApp</a>
                </div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  const dispatchText = [
    `PACESETTERS G-TRAVELS LIMITED: NEW PROTOCOL REQUEST`,
    `Reference: ${refCode}`,
    `Principal / Contact: ${fullName}`,
    `Organization: ${org}`,
    `Email: ${email}`,
    `Phone / WhatsApp: ${phone}`,
    `Service Required: ${service}`,
    `Operational Hub: ${hub}`,
    `Preferred Fleet: ${vehicle}`,
    `Target Date: ${date}`,
    `Notes: ${notes}`
  ].join('\n');

  try {
    await sendResendEmail(apiKey, {
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `[${refCode}] Protocol Request: ${service} (${hub})`,
      html: dispatchHtml,
      text: dispatchText
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err?.message || 'Unable to send protocol request.' },
      502
    );
  }

  // Optional client receipt email (non-blocking if sandbox sender is restricted)
  try {
    const clientHtml = `
      <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;padding:28px 16px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0b0f14;padding:24px 28px;border-bottom:3px solid #0e9b78;">
            <div style="color:#14b88e;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Pacesetters G-Travels Limited</div>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">We Received Your Protocol Request</h1>
          </div>
          <div style="padding:24px 28px;color:#334155;font-size:14px;line-height:1.65;">
            <p style="margin-top:0;">Dear ${escapeHtml(fullName)},</p>
            <p>Thank you for contacting Pacesetters G-Travels Limited. Our 24/7 Operations Desk has received your request and assigned reference <strong>${escapeHtml(refCode)}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              ${buildRow('Service', escapeHtml(service))}
              ${buildRow('Operational Hub', escapeHtml(hub))}
              ${buildRow('Preferred Fleet', escapeHtml(vehicle))}
              ${buildRow('Target Date', escapeHtml(date))}
            </table>
            <p>For immediate coordination, reach our 24/7 Control Centre anytime on WhatsApp or phone at <strong>+234 806 334 4509</strong>.</p>
            <div style="margin-top:20px;">
              <a href="https://wa.me/2348063344509?text=${encodeURIComponent(`Hello Pacesetters G-Travels, following up on my booking reference ${refCode}.`)}" style="display:inline-block;background:#128c7e;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:13px;font-weight:600;">Chat on WhatsApp (+234 806 334 4509)</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendResendEmail(apiKey, {
      from: fromEmail,
      to: [email],
      reply_to: toEmail,
      subject: `Pacesetters G-Travels Confirmation [${refCode}]`,
      html: clientHtml,
      text: `Dear ${fullName},\n\nWe received your protocol request (${refCode}) for ${service} in ${hub}.\nFor immediate assistance, contact our 24/7 Control Centre via WhatsApp or phone at +234 806 334 4509.\n\nPacesetters G-Travels Limited`
    });
  } catch {
    // Do not fail the booking if the client receipt cannot be delivered in test mode
  }

  return jsonResponse({ ok: true, refCode }, 200);
};
