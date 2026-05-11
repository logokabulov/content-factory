// ============================================================
//  PROMPTS.JS — AI promptlari
//  Kontent sifatini yaxshilash uchun faqat shu yerda o'zgartiring
// ============================================================

const PROMPTS = {

  // ----------------------------------------------------------
  // 1. MODEL TANLASH
  // claude-sonnet-4-20250514  → tez va sifatli (tavsiya)
  // claude-opus-4-20250514    → eng yaxshi sifat (sekin, qimmat)
  // claude-haiku-4-5-20251001 → eng tez (arzon, oddiy)
  // ----------------------------------------------------------
  model:     "claude-sonnet-4-20250514",
  maxTokens: 2000,

  // ----------------------------------------------------------
  // 2. TIL KO'RSATMALARI
  // Yangi til qo'shsangiz config.js va shu joyga qo'shing
  // ----------------------------------------------------------
  langInstruction: {
    uz: "Barcha matnlarni o'zbek tilida yoz.",
    ru: "Пиши все тексты на русском языке.",
    en: "Write all content in English.",
  },

  // ----------------------------------------------------------
  // 3. USLUB XARITASI
  // Yangi uslub qo'shsangiz config.js va shu joyga qo'shing
  // ----------------------------------------------------------
  toneMap: {
    friendly:     "do'stona va samimiy",
    professional: "professional va rasmiy",
    motivational: "motivatsion va ilhomlantiruvchi",
    educational:  "ta'limiy va tushuntiruvchi",
    humorous:     "kulgili va engil",
    bold:         "qat'iy va ishonchli",
  },

  // ----------------------------------------------------------
  // 4. PLATFORMA PROMPTLARI
  // Har bir platforma uchun AI ga ko'rsatma.
  // Yangi platforma qo'shsangiz config.js va shu joyga qo'shing.
  // ----------------------------------------------------------
  platforms: {

    threads: `
## THREADS POST
- Uzunlik: 200-400 belgi
- Birinchi jumla: e'tiborni tortsin, savol yoki kuchli bayonot
- Tuzilma: kirish → asosiy fikr → xulosa/CTA
- Hashtag: 3-5 ta, oxirida
- Jonli, AI yozmagandek bo'lsin
`,

    instagram: `
## INSTAGRAM KARUSEL
10 slayd uchun matn. Aniq formatda yoz:

Slayd 1: [Jalb qiluvchi sarlavha - savol yoki muammo]
[2-3 jumla kirish]

Slayd 2: [Sarlavha]
[Matn]

... (slayd 3 dan 9 gacha)

Slayd 10: [Xulosa sarlavhasi]
[Yakuniy fikr + CTA: saqlash, ulashish, obuna]
`,

    telegram: `
## TELEGRAM POST
- Uzunlik: 300-600 belgi
- Boshi: kuchli birinchi jumla (3 soniyada ushlab qolsin)
- Tuzilma: paragraflar orasida bo'sh qator
- Emoji: organik ishlatilsin, ko'p bo'lmasin
- Oxiri: savol yoki CTA (javob yozishga undash)
- Laqqa uslubida, lekin mazmunan boy
`,

    reels: `
## REELS / YOUTUBE SHORTS SKRIPT (60 soniya)

KIRISH (0–5 sek):
[E'tiborni 3 soniyada tortadigan jumla. Savol yoki keskin bayonot]

ASOSIY QISM (5–50 sek):
[Nuqta 1]: [Matn]
[Nuqta 2]: [Matn]
[Nuqta 3]: [Matn]

XULOSA (50–60 sek):
[Xulosa + CTA: obuna, like, savol]

REJISSYOR KO'RSATMALARI:
- Kirish sahnasi: [tavsif]
- B-roll: [nima ko'rinsin]
- Grafika: [matn overlay]
`,

    // --- Yangi platforma prompti namunasi ---
    // twitter: `
    // ## TWITTER / X POST
    // - Variant 1: bitta tweet (280 belgi)
    // - Variant 2: 5 ta tweetdan iborat thread
    // - Har tweet: alohida fikr, raqam bilan (1/5, 2/5...)
    // - Oxirgi tweet: xulosa + like/RT so'rash
    // `,
    //
    // linkedin: `
    // ## LINKEDIN POST
    // - Uzunlik: 400-800 belgi
    // - Boshi: kuchli birinchi jumla (ko'proq ko'rsatish uchun)
    // - Professional, lekin shaxsiy tajriba bilan
    // - 3-5 ta professional hashtag
    // - CTA: fikr so'rash, tajriba ulashishga undash
    // `,

  },

  // ----------------------------------------------------------
  // 5. ASOSIY TIZIM PROMPTI
  // AI ning umumiy xulq-atvori uchun
  // ----------------------------------------------------------
  systemPrompt: `Sen professional kontent yaratuvchi yordamchisan.
Qoidalar:
- AI yozganligi sezilmasin, jonli va haqiqiy bo'lsin
- Har bir platform uchun alohida optimallashtirilgan bo'lsin
- Muallif uslubiga mos bo'lsin
- Faqat kontent yoz, "Mana sizning kontentingiz" kabi kirish kerak emas`,

};
