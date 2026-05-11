// ============================================================
//  CONFIG.JS — Asosiy sozlamalar fayli
//  Yangi platforma, til, uslub qo'shish — faqat shu yerda!
// ============================================================

const CONFIG = {

  // ----------------------------------------------------------
  // 1. ILOVA MA'LUMOTLARI
  // ----------------------------------------------------------
  app: {
    name:    "Content Factory",
    tagline: "Bitta g'oyadan barcha platformalar uchun kontent yarating",
  },

  // ----------------------------------------------------------
  // 2. PLATFORMALAR
  // Yangi platforma qo'shish:
  //   1. Shu yerga qo'shing
  //   2. prompts.js ga shu id uchun prompt yozing
  // ----------------------------------------------------------
  platforms: [
    {
      id:      "threads",
      emoji:   "💬",
      name:    "Threads",
      desc:    "Qisqa va ta'sirli post",
      active:  true,   // boshlanganda tanlangan bo'ladimi?
    },
    {
      id:      "instagram",
      emoji:   "📱",
      name:    "Instagram karusel",
      desc:    "10 slayd uchun matn",
      active:  true,
    },
    {
      id:      "telegram",
      emoji:   "✈️",
      name:    "Telegram post",
      desc:    "Kanalga tayyor post",
      active:  true,
    },
    {
      id:      "reels",
      emoji:   "🎬",
      name:    "Reels / Shorts",
      desc:    "Video skript 60 sek",
      active:  true,
    },
    // --- Yangi platforma qo'shish namunasi ---
    // {
    //   id:     "twitter",
    //   emoji:  "🐦",
    //   name:   "Twitter / X",
    //   desc:   "Thread yoki post",
    //   active: false,
    // },
    // {
    //   id:     "linkedin",
    //   emoji:  "💼",
    //   name:   "LinkedIn",
    //   desc:   "Professional post",
    //   active: false,
    // },
  ],

  // ----------------------------------------------------------
  // 3. USLUBLAR (TONE)
  // Yangi uslub qo'shish: shu yerga qo'shing, prompts.js da
  // toneMap ga ham qo'shing
  // ----------------------------------------------------------
  tones: [
    { value: "friendly",     label: "Do'stona va samimiy" },
    { value: "professional", label: "Professional va rasmiy" },
    { value: "motivational", label: "Motivatsion va ilhomlantiruvchi" },
    { value: "educational",  label: "Ta'limiy va tushuntiruvchi" },
    { value: "humorous",     label: "Kulgili va engil" },
    { value: "bold",         label: "Qat'iy va ishonchli" },
  ],

  // ----------------------------------------------------------
  // 4. TILLAR
  // Yangi til qo'shish: shu yerga qo'shing, prompts.js da
  // langInstruction ga ham qo'shing
  // ----------------------------------------------------------
  languages: [
    { value: "uz", label: "🇺🇿 O'zbek" },
    { value: "ru", label: "🇷🇺 Русский" },
    { value: "en", label: "🇬🇧 English" },
  ],

  // ----------------------------------------------------------
  // 5. DIZAYN RANGLARI
  // Rangni o'zgartirish uchun faqat shu yerda o'zgartiring
  // ----------------------------------------------------------
  theme: {
    accent:        "#e8a045",   // asosiy rang (tugma, border)
    accentBg:      "#221608",   // accent fon
    accentBorder:  "#4a3010",   // accent chegara
    bg:            "#0f0f0f",   // sahifa foni
    bg2:           "#181818",   // karta foni
    bg3:           "#222222",   // input foni
    border:        "#2c2c2c",   // chegara rangi
    text:          "#f0ede8",   // asosiy matn
    text2:         "#888480",   // ikkinchi darajali matn
    success:       "#52b788",   // muvaffaqiyat rangi
    danger:        "#e05252",   // xato rangi
  },

};
