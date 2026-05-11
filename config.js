const CONFIG = {

  supabase: {
    url:     "https://hhmiufnfkomsohblhrxn.supabase.co",
    anonKey: "sb_publishable_2P7NX029cOU2NtOWG1s3Yw_vwzWKgVN",
  },

  app: {
    name:    "Content Factory",
    tagline: "AI bilan kontent yarating",
  },

  platforms: [
    { id: "threads",   emoji: "💬", name: "Threads",           desc: "Qisqa post",    active: true },
    { id: "instagram", emoji: "📱", name: "Instagram karusel", desc: "10 slayd matn", active: true },
    { id: "telegram",  emoji: "✈️", name: "Telegram post",     desc: "Kanal post",    active: true },
    { id: "reels",     emoji: "🎬", name: "Reels / Shorts",    desc: "Video skript",  active: true },
  ],

  tones: [
    { value: "friendly",     label: "Do'stona va samimiy"    },
    { value: "professional", label: "Professional va rasmiy" },
    { value: "motivational", label: "Motivatsion"            },
    { value: "educational",  label: "Ta'limiy"               },
    { value: "humorous",     label: "Kulgili va engil"       },
    { value: "bold",         label: "Qat'iy va ishonchli"    },
  ],

  languages: [
    { value: "uz", label: "🇺🇿 O'zbek"  },
    { value: "ru", label: "🇷🇺 Русский" },
    { value: "en", label: "🇬🇧 English" },
  ],

  theme: {
    accent:       "#e8a045",
    accentBg:     "#221608",
    accentBorder: "#4a3010",
    bg:           "#0a0a0a",
    bg2:          "#141414",
    bg3:          "#1e1e1e",
    bg4:          "#282828",
    border:       "#2a2a2a",
    border2:      "#383838",
    text:         "#f0ede8",
    text2:        "#808080",
    text3:        "#454545",
    success:      "#52b788",
    danger:       "#e05252",
  },
};
