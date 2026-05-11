# 🏭 Content Factory

## 📁 Fayllar va ularning vazifasi

```
cf-content-factory/
│
├── config.js              ← 🔧 Platformalar, ranglar, tillar, uslublar
├── prompts.js             ← ✍️  AI promptlari va model tanlash
├── style.css              ← 🎨  Dizayn va uslublar
│
├── index.html             ← 🖥️  HTML skelet (tegmang)
├── app.js                 ← ⚙️  Logika (tegmang)
│
└── functions/api/
    └── generate.js        ← 🔌  Backend API (tegmang)
```

---

## ✏️ Qanday o'zgartirish kerak?

| Nima o'zgartirmoqchisiz? | Qaysi fayl? |
|--------------------------|-------------|
| Yangi platforma qo'shish | `config.js` + `prompts.js` |
| Platforma nomini o'zgartirish | `config.js` |
| Yangi til qo'shish | `config.js` + `prompts.js` |
| Yangi uslub (tone) qo'shish | `config.js` + `prompts.js` |
| Ranglarni o'zgartirish | `config.js` → `theme` bo'limi |
| AI promptini yaxshilash | `prompts.js` → `platforms` bo'limi |
| AI modelini o'zgartirish | `prompts.js` → `model` qatori |
| Ilova nomini o'zgartirish | `config.js` → `app.name` |
| Tugma yoki karta dizayni | `style.css` |

---

## ➕ Yangi platforma qo'shish (misol: Twitter)

**1. config.js ga qo'shing:**
```js
{
  id:     "twitter",
  emoji:  "🐦",
  name:   "Twitter / X",
  desc:   "Thread yoki post",
  active: false,
},
```

**2. prompts.js ga qo'shing:**
```js
twitter: `
## TWITTER POST
- Variant 1: bitta tweet (280 belgi)
- Variant 2: 5 tweetli thread
`,
```

**3. functions/api/generate.js ga qo'shing:**
```js
twitter: `
## TWITTER POST
- 280 belgi yoki thread
`,
```

Shu 3 joy — boshqa hech narsa tegmaydi!

---

## 🚀 Deploy qilish

### 1. GitHub
1. github.com → New repository → `content-factory`
2. Barcha fayllarni yuklang

### 2. Cloudflare Pages
1. dash.cloudflare.com → Workers & Pages → Create → Pages
2. Connect to Git → reponi tanlang
3. Build command: (bo'sh)
4. Deploy

### 3. API kalit
Pages → Settings → Environment variables:
```
ANTHROPIC_API_KEY = sk-ant-xxxxx
```
→ Save → Redeploy

---

## 🔑 Anthropic API kaliti
console.anthropic.com → API Keys → Create Key
