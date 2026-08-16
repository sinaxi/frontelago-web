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
  const html =
    "<h2>Richiesta informazioni dal sito Frontelago</h2><table>" +
    lines
      .map(
        ([k, v]) =>
          "<tr><td><strong>" + k + "</strong></td><td>" + escapeHtml(v) + "</td></tr>"
      )
      .join("") +
    "</table><p><strong>Messaggio:</strong></p><p>" +
    escapeHtml(data.messaggio).replace(/\n/g, "<br>") +
    "</p>";

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
