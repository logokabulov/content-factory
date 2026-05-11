// ============================================================
//  APP.JS — Frontend logikasi
//  Bu faylga odatda tegmasangiz bo'ladi.
//  Barcha sozlamalar config.js da.
// ============================================================

// --- Tema ranglarini CSS variables sifatida qo'llash ---
(function applyTheme() {
  const t = CONFIG.theme;
  const r = document.documentElement.style;
  r.setProperty("--accent",         t.accent);
  r.setProperty("--accent-bg",      t.accentBg);
  r.setProperty("--accent-border",  t.accentBorder);
  r.setProperty("--bg",             t.bg);
  r.setProperty("--bg2",            t.bg2);
  r.setProperty("--bg3",            t.bg3);
  r.setProperty("--border",         t.border);
  r.setProperty("--text",           t.text);
  r.setProperty("--text2",          t.text2);
  r.setProperty("--success",        t.success);
  r.setProperty("--danger",         t.danger);

  document.body.style.background = t.bg;
  document.body.style.color      = t.text;
})();

// --- Ilova ma'lumotlarini ko'rsatish ---
document.getElementById("appName").textContent   = CONFIG.app.name;
document.getElementById("appTagline").textContent = CONFIG.app.tagline;
document.title = CONFIG.app.name;

// --- Platformalar ---
const platformsEl = document.getElementById("platforms");
CONFIG.platforms.forEach(p => {
  const btn = document.createElement("button");
  btn.className   = "platform-btn" + (p.active ? " active" : "");
  btn.dataset.pid = p.id;
  btn.style.background   = p.active ? "var(--accent-bg)"    : "var(--bg3)";
  btn.style.borderColor  = p.active ? "var(--accent-border)" : "var(--border)";
  btn.style.color        = "var(--text)";
  btn.innerHTML = `
    <span class="p-emoji">${p.emoji}</span>
    <span class="p-name">${p.name}</span>
    <span class="p-desc" style="color:${p.active ? "var(--accent)" : "var(--text2)"}">${p.desc}</span>
  `;
  btn.addEventListener("click", () => {
    const on = btn.classList.toggle("active");
    btn.style.background  = on ? "var(--accent-bg)"    : "var(--bg3)";
    btn.style.borderColor = on ? "var(--accent-border)" : "var(--border)";
    btn.querySelector(".p-desc").style.color = on ? "var(--accent)" : "var(--text2)";
  });
  platformsEl.appendChild(btn);
});

// --- Uslublar ---
const toneEl = document.getElementById("tone");
CONFIG.tones.forEach(t => {
  const opt = document.createElement("option");
  opt.value = t.value;
  opt.textContent = t.label;
  toneEl.appendChild(opt);
});

// --- Tillar ---
const langEl = document.getElementById("language");
CONFIG.languages.forEach(l => {
  const opt = document.createElement("option");
  opt.value = l.value;
  opt.textContent = l.label;
  langEl.appendChild(opt);
});

// --- Input stillari ---
function styleInputs() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.style.background   = "var(--bg3)";
    el.style.borderColor  = "var(--border)";
    el.style.color        = "var(--text)";
    el.addEventListener("focus", () => el.style.borderColor = "var(--accent)");
    el.addEventListener("blur",  () => el.style.borderColor = "var(--border)");
  });
}
styleInputs();

// --- Belgi sanagich ---
document.getElementById("topic").addEventListener("input", function () {
  document.getElementById("charCount").textContent = this.value.length + " belgi";
});

// --- Kontent yaratish ---
const genBtn = document.getElementById("genBtn");
const copyTimers = {};

function parseContent(text, platforms) {
  const result = {};
  platforms.forEach((pid, i) => {
    const label = pid.toUpperCase().replace("instagram", "INSTAGRAM KARUSEL")
      .replace("threads", "THREADS POST")
      .replace("telegram", "TELEGRAM POST")
      .replace("reels", "REELS");
    const regex = new RegExp(`##\\s*${label}[^\\n]*\\n([\\s\\S]*?)(?=##\\s*[A-Z]|$)`, "i");
    const m = text.match(regex);
    result[pid] = m
      ? m[1].trim()
      : (text.split(/##\s+/)[i + 1] || text).replace(/^[A-Z\s\/()0-9]+\n/, "").trim();
  });
  return result;
}

function showError(msg) {
  const el = document.getElementById("errorBox");
  el.textContent  = msg;
  el.style.display = "block";
  el.style.background  = "#200e0e";
  el.style.borderColor = "#4a1010";
  el.style.color       = "var(--danger)";
}
function hideError() {
  document.getElementById("errorBox").style.display = "none";
}

genBtn.addEventListener("click", async () => {
  const topic    = document.getElementById("topic").value.trim();
  const selected = [...document.querySelectorAll(".platform-btn.active")].map(b => b.dataset.pid);

  if (!topic)            { showError("Iltimos, kontent mavzusini kiriting."); return; }
  if (!selected.length)  { showError("Kamida bitta platformani tanlang.");    return; }
  hideError();

  genBtn.disabled  = true;
  genBtn.innerHTML = '<span class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f0a02"></span> Yaratilmoqda...';
  document.getElementById("results").innerHTML = "";

  try {
    const res = await fetch("/api/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:      document.getElementById("name").value.trim(),
        niche:     document.getElementById("niche").value.trim(),
        audience:  document.getElementById("audience").value.trim(),
        tone:      document.getElementById("tone").value,
        language:  document.getElementById("language").value,
        topic,
        extra:     document.getElementById("extra").value.trim(),
        platforms: selected,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Xato yuz berdi");

    const parsed  = parseContent(data.content, selected);
    const wrapper = document.getElementById("results");
    wrapper.innerHTML = `<div class="results-label" style="color:var(--success)">✅ Tayyor kontent</div>`;

    selected.forEach(pid => {
      const pInfo = CONFIG.platforms.find(p => p.id === pid) || {};
      const card  = document.createElement("div");
      card.className = "result-card";
      card.style.cssText = `background:var(--bg2);border-color:var(--border)`;
      card.innerHTML = `
        <div class="result-header" style="border-bottom-color:var(--border)">
          <div class="result-platform">${pInfo.emoji || ""} ${pInfo.name || pid}</div>
          <button class="copy-btn" id="copy-${pid}"
            style="border-color:var(--border);color:var(--text2)">
            Nusxa olish
          </button>
        </div>
        <pre class="result-body">${parsed[pid] || "Kontent topilmadi."}</pre>
      `;
      wrapper.appendChild(card);

      document.getElementById(`copy-${pid}`).addEventListener("click", () => {
        navigator.clipboard.writeText(parsed[pid] || "").catch(() => {});
        const btn = document.getElementById(`copy-${pid}`);
        btn.textContent   = "✓ Nusxalandi";
        btn.style.color   = "var(--success)";
        btn.style.borderColor = "var(--success)";
        clearTimeout(copyTimers[pid]);
        copyTimers[pid] = setTimeout(() => {
          btn.textContent   = "Nusxa olish";
          btn.style.color   = "var(--text2)";
          btn.style.borderColor = "var(--border)";
        }, 2000);
      });
    });

    wrapper.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showError("Xato: " + err.message);
  } finally {
    genBtn.disabled  = false;
    genBtn.innerHTML = "✦ Kontent yaratish";
  }
});
