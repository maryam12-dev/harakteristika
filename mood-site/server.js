import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-sonnet-5-5";
if (!KEY) console.warn("DIQQAT: ANTHROPIC_API_KEY o'rnatilmagan!");

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const ROLES = {
  PL: "Ideya generatori (Plant)",
  RI: "Aloqachi (Resource Investigator)",
  CO: "Koordinator (Co-ordinator)",
  SH: "Harakatlantiruvchi (Shaper)",
  ME: "Tahlilchi (Monitor Evaluator)",
  TW: "Jamoa o'yinchisi (Teamworker)",
  IM: "Ijrochi (Implementer)",
  CF: "Yakunlovchi (Completer Finisher)",
  SP: "Mutaxassis (Specialist)",
};

// IP bo'yicha limit: daqiqasiga 12 ta so'rov
const hits = new Map();
setInterval(() => hits.clear(), 60_000).unref();

function systemPrompt(scores) {
  const list = Object.keys(ROLES)
    .filter((k) => Number.isFinite(scores?.[k]))
    .map((k) => [k, Math.max(0, Math.min(100, Math.round(scores[k])))])
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${ROLES[k]}: ${v}%`)
    .join("; ");
  return `Sen Belbin jamoa rollari bo'yicha iliq, aniq va amaliy maslahatchisan. Foydalanuvchi o'zbek tilida o'z-o'zini baholash testidan o'tdi (u boshqa tilda yozsa, o'sha tilda javob ber). Uning natijalari (kamayish tartibida): ${list || "mavjud emas"}. Maslahatni shu natijalarga tayanib ber: jamoada ishlash, hamkorlar tanlash, kuchli tomonlarni qo'llash va kam rivojlangan rollarni o'stirish haqida. Javob qisqa bo'lsin (4-7 gap), kerak bo'lsa 2-3 qisqa band ishlatishing mumkin. Test rasmiy emas, shaxsiyatni to'liq tavsiflamaydi va tashxis emas, rollar vaziyatga qarab o'zgarishi mumkinligini kerak bo'lganda eslat. Kasb tanlash kabi katta qarorlar uchun faqat shu testga tayanmaslikni ayt. Psixologik tashxis qo'yma.`;
}

app.post("/api/chat", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  const n = (hits.get(ip) || 0) + 1;
  hits.set(ip, n);
  if (n > 12) return res.status(429).json({ error: "Juda ko'p so'rov" });

  const { messages, scores } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "Noto'g'ri so'rov" });

  let clean = messages
    .slice(-10)
    .filter((x) => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
    .map((x) => ({ role: x.role, content: x.content.slice(0, 1000) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean.at(-1).role !== "user") return res.status(400).json({ error: "Noto'g'ri so'rov" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, system: systemPrompt(scores), messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("API xatosi:", data);
      return res.status(502).json({ error: "AI xatosi" });
    }
    const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Ishga tushdi: http://localhost:" + (process.env.PORT || 3000)));
