const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
  ru: "Pishi vse teksty na russkom yazyke.",
  en: "Write all content in English.",
};

const PLATFORM_PROMPTS = {
  threads:   "\n\n## THREADS POST\n- 200-400 belgi\n- Birinchi jumla etiborni tortsin\n- Hashtag: 3-5 ta oxirida\n- Jonli, real bolsin",
  instagram: "\n\n## INSTAGRAM KARUSEL\n10 slayd formatda:\nSlayd 1: [Sarlavha]\n[2-3 jumla]\nSlayd 2-9: [Sarlavha]\n[Matn]\nSlayd 10: [Xulosa + CTA]",
  telegram:  "\n\n## TELEGRAM POST\n- 300-600 belgi\n- Paragraflar orasida bosh qator\n- Emoji organik\n- Oxiri: savol yoki CTA",
  reels:     "\n\n## REELS SKRIPT\nKIRISH (0-5 sek): [Etiborni tortuvchi jumla]\nASOSIY QISM (5-50 sek): [3-4 nuqta]\nXULOSA (50-60 sek): [CTA]\nREJISSYOR: [sahnalar]",
};

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { name, niche, audience, tone, language, topic, extra, platforms } =
      await request.json();

    if (!topic || !platforms || !platforms.length) {
      return Response.json(
        { error: "Mavzu va platforma kerak" },
        { status: 400, headers: CORS }
      );
    }

    const langInstr    = LANG_MAP[language]  || LANG_MAP.uz;
    const toneLabel    = TONE_MAP[tone]       || TONE_MAP.friendly;
    const platSections = platforms.map(p => PLATFORM_PROMPTS[p] || "").join("\n");

    const prompt = `Sen professional kontent yaratuvchi yordamchisan.
${langInstr}

MUALLIF:    ${name     || "Muallif"}
NISHA:      ${niche    || "Umumiy"}
AUDITORIYA: ${audience || "Keng auditoriya"}
USLUB:      ${toneLabel}
MAVZU:      ${topic}
${extra ? "QOSHIMCHA: " + extra : ""}

Qoidalar:
- AI yozganligi sezilmasin, jonli va haqiqiy bolsin
- Har bir platform uchun alohida optimallashtirilgan bolsin
- Faqat kontent yoz, kirish jumlalari kerak emas
${platSections}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 2000,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq xatosi");

    return Response.json(
      { content: data.choices[0].message.content },
      { headers: CORS }
    );
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
