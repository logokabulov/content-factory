// ============================================================
//  functions/api/generate.js — Backend (Cloudflare Worker)
//  Bu faylga odatda tegmasangiz bo'ladi.
//  Promptlarni o'zgartirish → prompts.js (frontend)
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Platforma sarlavhalari (parse qilish uchun)
const SECTION_LABELS = {
  threads:   "THREADS POST",
  instagram: "INSTAGRAM KARUSEL",
  telegram:  "TELEGRAM POST",
  reels:     "REELS",
};

const TONE_MAP = {
  friendly:     "do'stona va samimiy",
  professional: "professional va rasmiy",
  motivational: "motivatsion va ilhomlantiruvchi",
  educational:  "ta'limiy va tushuntiruvchi",
  humorous:     "kulgili va engil",
  bold:         "qat'iy va ishonchli",
};

const LANG_MAP = {
  uz: "Barcha matnlarni o'zbek tilida yoz.",
  ru: "Пиши все тексты на русском языке.",
  en: "Write all content in English.",
};

const PLATFORM_PROMPTS = {
  threads: `
## THREADS POST
- Uzunlik: 200-400 belgi
- Birinchi jumla: e'tiborni tortsin
- Hashtag: 3-5 ta, oxirida
- Jonli, AI yozmagandek bo'lsin
`,
  instagram: `
## INSTAGRAM KARUSEL
10 slayd uchun aniq formatda:
Slayd 1: [Jalb qiluvchi sarlavha]
[2-3 jumla]
Slayd 2-9: [Sarlavha]\n[Matn]
Slayd 10: [Xulosa + CTA]
`,
  telegram: `
## TELEGRAM POST
- Uzunlik: 300-600 belgi
- Paragraflar orasida bo'sh qator
- Emoji organik ishlatilsin
- Oxiri: savol yoki CTA
`,
  reels: `
## REELS / YOUTUBE SHORTS SKRIPT
KIRISH (0-5 sek): [E'tiborni tortuvchi jumla]
ASOSIY QISM (5-50 sek): [3-4 nuqta]
XULOSA (50-60 sek): [CTA]
REJISSYOR KO'RSATMALARI: [sahnalar]
`,
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const {
      name, niche, audience, tone,
      language, topic, extra, platforms,
    } = await request.json();

    if (!topic || !platforms?.length) {
      return Response.json(
        { error: "Mavzu va platforma kerak" },
        { status: 400, headers: CORS }
      );
    }

    const langInstruction = LANG_MAP[language]   || LANG_MAP.uz;
    const toneLabel       = TONE_MAP[tone]        || TONE_MAP.friendly;
    const platformSections = platforms
      .map(p => PLATFORM_PROMPTS[p] || `\n## ${p.toUpperCase()}\n`)
      .join("\n");

    const prompt = `Sen professional kontent yaratuvchi yordamchisan.
${langInstruction}

MUALLIF:    ${name     || "Muallif"}
NISHA:      ${niche    || "Umumiy"}
AUDITORIYA: ${audience || "Keng auditoriya"}
USLUB:      ${toneLabel}
MAVZU:      ${topic}
${extra ? "QO'SHIMCHA: " + extra : ""}

Qoidalar:
- AI yozganligi sezilmasin, jonli va haqiqiy bo'lsin
- Har bir platform uchun alohida optimallashtirilgan bo'lsin
- Faqat kontent yoz, kirish jumlalari kerak emas

${platformSections}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Anthropic xatosi");

    const content = data.content.map(c => c.text || "").join("");
    return Response.json({ content }, { headers: CORS });

  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: CORS }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
