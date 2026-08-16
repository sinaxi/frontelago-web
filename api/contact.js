// Vercel serverless function: inoltra le richieste del form di contatto
// via Resend. La chiave va impostata su Vercel come env RESEND_API_KEY.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Frontelago <info@richiestainfo.com>";
const TO = "atticofrontelago@gmail.com";
const SUBJECT = "Frontelago - Richiesta informazioni";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RESEND_API_KEY non configurata" });
  }

  const { nome, email, telefono, date, messaggio } = req.body || {};
  const clean = (v) => String(v || "").trim().slice(0, 5000);
  const data = {
    nome: clean(nome).slice(0, 200),
    email: clean(email).slice(0, 320),
    telefono: clean(telefono).slice(0, 60),
    date: clean(date).slice(0, 200),
    messaggio: clean(messaggio),
  };

  if (!data.nome || !data.email || !data.messaggio) {
    return res.status(400).json({ error: "Compila nome, email e messaggio." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ error: "Indirizzo email non valido." });
  }

  const lines = [
    ["Nome", data.nome],
    ["Email", data.email],
    ["Telefono", data.telefono || "-"],
    ["Date soggiorno", data.date || "-"],
  ];
  const text =
    lines.map(([k, v]) => k + ": " + v).join("\n") +
    "\n\nMessaggio:\n" +
    data.messaggio;

  // Palette e stile della card del form nel footer del sito
  const AVORIO = "#f5efe0";
  const NERO = "#1a1815";
  const SENAPE = "#c9971c";
  const BORDO = "rgba(26, 24, 21, 0.14)";
  const FONT = "Montserrat, system-ui, Arial, sans-serif";

  const labelStyle =
    "font-family:" + FONT + ";font-size:12px;font-weight:600;" +
    "letter-spacing:0.08em;text-transform:uppercase;color:" + NERO + ";" +
    "padding:0 0 6px 18px;";
  const pillStyle =
    "font-family:" + FONT + ";font-size:16px;line-height:1.4;color:" + NERO + ";" +
    "background:" + AVORIO + ";border:1px solid " + BORDO + ";" +
    "border-radius:999px;padding:13px 18px;";

  const fieldRow = (label, value) =>
    '<tr><td style="' + labelStyle + '">' + label + "</td></tr>" +
    '<tr><td style="' + pillStyle + '">' + escapeHtml(value) + "</td></tr>" +
    '<tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>';

  const html =
    '<body style="margin:0;padding:0;background:' + AVORIO + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + AVORIO + ';padding:32px 16px;">' +
    "<tr><td align=\"center\">" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:28px;padding:32px 28px;">' +
    "<tr><td>" +
    '<p style="font-family:' + FONT + ';font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:' + SENAPE + ';margin:0 0 6px;">Frontelago</p>' +
    '<h1 style="font-family:' + FONT + ';font-size:22px;font-weight:600;color:' + NERO + ';margin:0 0 24px;">Richiesta informazioni dal sito</h1>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    lines.map(([k, v]) => fieldRow(k, v)).join("") +
    '<tr><td style="' + labelStyle + '">Messaggio</td></tr>' +
    '<tr><td style="font-family:' + FONT + ';font-size:16px;line-height:1.5;color:' + NERO + ';background:' + AVORIO + ';border:1px solid ' + BORDO + ';border-radius:20px;padding:16px 18px;">' +
    escapeHtml(data.messaggio).replace(/\n/g, "<br>") +
    "</td></tr>" +
    "</table>" +
    '<p style="font-family:' + FONT + ';font-size:12px;color:rgba(26,24,21,0.55);margin:24px 0 0;text-align:center;">Rispondi a questa email per scrivere direttamente all\u2019ospite.</p>' +
    "</td></tr></table>" +
    "</td></tr></table></body>";

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: data.email,
        subject: SUBJECT,
        text: text,
        html: html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend error:", response.status, detail);
      return res.status(502).json({ error: "Invio non riuscito. Riprova più tardi." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend request failed:", err);
    return res.status(502).json({ error: "Invio non riuscito. Riprova più tardi." });
  }
};
