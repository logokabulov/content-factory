const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const TONE_MAP = {
  friendly: "do'stona va samimiy",
  professional: "professional va rasmiy",
  motivational: "motivatsion va ilhomlantiruvchi",
  educational: "ta'limiy va tushuntiruvchi",
  humorous: "kulgili va engil",
  bold: "qat'iy va ishonchli",
};

const LANG_MAP = {
  uz: "Barcha matnlarni o'zbek tilida yoz.",
  ru: "Пиши все тексты на русском языке.",
  en: "Write all content in English.",
};

const PLATFORM_PROMPTS = {
  threads: `\n\n## THREADS POST\n- Uzunlik: 200-400 belgi\n- Birinchi jumla: e'tiborni tortsin\n- Hashtag: 3-5 ta, oxirida\n- Jonli, AI yozmagandek bo'lsin`,
  instagram: `\n\n## INSTAGRAM KARUSEL\n10 slayd uchun aniq formatda:\nSlayd 1: [Jalb qiluvchi sarlavha]\n[2-3 jumla]\nSlayd 2-9: [Sarlavha]\n[Matn]\nSlayd 10: [Xulosa + CTA]`,
  telegram: `\n\n## TELEGRAM POST\n- Uzunlik: 300-600 belgi\n- Paragraflar orasida bo'sh qator\n- Emoji organik ishlatilsin\n- Oxiri: savol yoki CTA`,
  reels: `\n\n## REELS / YOUTUBE SHORTS SKRIPT\nKIRISH (0-5 sek): [E'tiborni tortuvchi jumla]\nASOSIY QISM (5-50 sek): [3-4 nuqta]\nXULOSA (50-60 sek): [CTA]\nREJISSYOR KO'RSATMALARI: [sahnalar]`,
};

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { name, niche, audience, tone, language, topic, extra, platforms } =
      await request.json();

    if (!topic || !platforms?.length) {
      return Response.json(
        { error: "Mavzu va platforma kerak" },
        { status: 400, headers: CORS }
      );
    }

    const langInstruction = LANG_MAP[language] || LANG_MAP.uz;
    const toneLabel = TONE_MAP[tone] || TONE_MAP.friendly;
    const platformSections = platforms
      .map((p) => PLATFORM_PROMPTS[p] || "")
      .join("\n");

    const prompt = `Sen professional kontent yaratuvchi yordamchisan.
${langInstruction}

MUALLIF: ${name || "Muallif"}
NISHA: ${niche || "Umumiy"}
AUDITORIYA: ${audience || "Keng auditoriya"}
USLUB: ${toneLabel}
MAVZU: ${topic}
${extra ? "QO'SHIMCHA: " + extra : ""}

Qoidalar:
- AI yozganligi sezilmasin, jonli va haqiqiy bo'lsin
- Har bir platform uchun alohida optimallashtirilgan bo'lsin
- Faqat kontent yoz, kirish jumlalari kerak emas
${platformSections}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq xatosi");

    const content = data.choices[0].message.content;
    return Response.json({ content }, { headers: CORS });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
