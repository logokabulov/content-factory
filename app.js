const sb = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let currentUser    = null;
let currentProject = null;
let projects       = [];
let deleteTargetId = null;
let copyTimers     = {};

const $    = id => document.getElementById(id);
const show = (...ids) => ids.forEach(id => $(id).classList.remove("hidden"));
const hide = (...ids) => ids.forEach(id => $(id).classList.add("hidden"));
const showErr = (elId, msg) => { const el=$(elId); el.textContent=msg; el.style.display="block"; };
const hideErr = elId => { $(elId).style.display="none"; };
function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("uz-UZ") + " " + d.toLocaleTimeString("uz-UZ", {hour:"2-digit",minute:"2-digit"});
}

async function init() {
  document.title = CONFIG.app.name;

  CONFIG.tones.forEach(t => {
    const o = document.createElement("option");
    o.value = t.value; o.textContent = t.label;
    $("tone").appendChild(o);
  });
  CONFIG.languages.forEach(l => {
    const o = document.createElement("option");
    o.value = l.value; o.textContent = l.label;
    $("language").appendChild(o);
  });

  buildPlatforms();
  bindEvents();

  const { data: { session } } = await sb.auth.getSession();
  if (session) { currentUser = session.user; showApp(); }
  else { showAuth(); }

  sb.auth.onAuthStateChange((_e, session) => {
    if (session) { currentUser = session.user; showApp(); }
    else { currentUser = null; showAuth(); }
  });
}

function showAuth() {
  hide("appScreen"); show("authScreen");
}

async function showApp() {
  hide("authScreen"); show("appScreen");
  $("userEmail").textContent = currentUser.email.split("@")[0];
  $("settingsEmail").textContent = currentUser.email;
  await loadProjects();
}

$("tabLogin").addEventListener("click", () => {
  $("tabLogin").classList.add("active");
  $("tabRegister").classList.remove("active");
  $("authBtn").textContent = "Kirish";
  hide("confirmField");
});
$("tabRegister").addEventListener("click", () => {
  $("tabRegister").classList.add("active");
  $("tabLogin").classList.remove("active");
  $("authBtn").textContent = "Ro'yxatdan o'tish";
  show("confirmField");
});

$("authBtn").addEventListener("click", async () => {
  const email    = $("authEmail").value.trim();
  const password = $("authPassword").value;
  const isLogin  = $("tabLogin").classList.contains("active");
  hideErr("authError");

  if (!email || !password) { showErr("authError","Email va parol kiriting"); return; }
  $("authBtn").disabled = true;
  $("authBtn").textContent = "...";

  if (isLogin) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      showErr("authError", error.message);
      $("authBtn").disabled = false;
      $("authBtn").textContent = "Kirish";
    }
  } else {
    const confirm = $("authConfirm").value;
    if (password !== confirm) {
      showErr("authError","Parollar mos emas");
      $("authBtn").disabled = false;
      $("authBtn").textContent = "Ro'yxatdan o'tish";
      return;
    }
    const { error } = await sb.auth.signUp({ email, password });
    if (error) { showErr("authError", error.message); }
    else {
      $("authMsg").textContent = "✓ Emailingizni tasdiqlang";
      $("authMsg").style.display = "block";
    }
    $("authBtn").disabled = false;
    $("authBtn").textContent = "Ro'yxatdan o'tish";
  }
});

async function loadProjects() {
  const { data } = await sb.from("projects")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  projects = data || [];
  renderProjects();
}

function renderProjects() {
  const list = $("projectsList");
  list.innerHTML = "";
  if (!projects.length) {
    list.innerHTML = '<div class="text2 text-sm" style="padding:4px 10px">Hali proyekt yo\'q</div>';
    return;
  }
  projects.forEach(p => {
    const div = document.createElement("div");
    div.className = "project-item" + (currentProject?.id === p.id ? " active" : "");
    div.innerHTML = `
      <span class="project-item-name">📁 ${p.name}</span>
      <button class="project-delete" data-id="${p.id}">✕</button>
    `;
    div.querySelector(".project-item-name").addEventListener("click", () => selectProject(p));
    div.querySelector(".project-delete").addEventListener("click", e => {
      e.stopPropagation();
      deleteTargetId = p.id;
      show("deleteModal");
    });
    list.appendChild(div);
  });
}

function selectProject(p) {
  currentProject = p;
  $("mainTitle").textContent = p.name;
  hide("emptyState"); show("contentForm");
  renderProjects();
  switchTab("create");
}

$("addProjectBtn").addEventListener("click", () => {
  $("projectName").value = "";
  $("projectNiche").value = "";
  $("projectAudience").value = "";
  show("newProjectModal");
  setTimeout(() => $("projectName").focus(), 100);
});
$("cancelProjectBtn").addEventListener("click", () => hide("newProjectModal"));
$("saveProjectBtn").addEventListener("click", async () => {
  const name = $("projectName").value.trim();
  if (!name) { $("projectName").focus(); return; }
  const { data, error } = await sb.from("projects").insert({
    user_id:  currentUser.id,
    name,
    niche:    $("projectNiche").value.trim(),
    audience: $("projectAudience").value.trim(),
  }).select().single();
  if (!error && data) {
    projects.unshift(data);
    renderProjects();
    selectProject(data);
    hide("newProjectModal");
  }
});

$("cancelDeleteBtn").addEventListener("click", () => { hide("deleteModal"); deleteTargetId=null; });
$("confirmDeleteBtn").addEventListener("click", async () => {
  if (!deleteTargetId) return;
  await sb.from("projects").delete().eq("id", deleteTargetId);
  if (currentProject?.id === deleteTargetId) {
    currentProject = null;
    $("mainTitle").textContent = "Proyekt tanlang";
    show("emptyState"); hide("contentForm");
  }
  projects = projects.filter(p => p.id !== deleteTargetId);
  deleteTargetId = null;
  hide("deleteModal");
  renderProjects();
});

function switchTab(tab) {
  ["create","history","settings"].forEach(t => {
    const el = $("tab" + t.charAt(0).toUpperCase() + t.slice(1));
    el.classList.add("hidden");
  });
  $("tab" + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove("hidden");
  document.querySelectorAll(".main-tab").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  if (tab === "history") loadHistory();
}

document.querySelectorAll(".main-tab").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

$("navSettings").addEventListener("click", () => {
  $("mainTitle").textContent = "Sozlamalar";
  hide("emptyState","contentForm");
  document.querySelectorAll(".main-tab").forEach(b => b.classList.remove("active"));
  ["tabCreate","tabHistory"].forEach(id => $(id).classList.add("hidden"));
  $("tabSettings").classList.remove("hidden");
});

function buildPlatforms() {
  const container = $("platforms");
  container.innerHTML = "";
  CONFIG.platforms.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "platform-btn" + (p.active ? " active" : "");
    btn.dataset.pid = p.id;
    btn.innerHTML = `<span class="p-emoji">${p.emoji}</span><span class="p-name">${p.name}</span><span class="p-desc">${p.desc}</span>`;
    btn.addEventListener("click", () => btn.classList.toggle("active"));
    container.appendChild(btn);
  });
}

$("topic").addEventListener("input", function() {
  $("charCount").textContent = this.value.length + " belgi";
});

$("genBtn").addEventListener("click", async () => {
  if (!currentProject) return;
  const topic    = $("topic").value.trim();
  const selected = [...document.querySelectorAll(".platform-btn.active")].map(b => b.dataset.pid);

  if (!topic)           { showErr("errorBox","Mavzuni kiriting"); return; }
  if (!selected.length) { showErr("errorBox","Platforma tanlang"); return; }
  hideErr("errorBox");

  const btn = $("genBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Yaratilmoqda...';
  $("results").innerHTML = "";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:      currentProject.name,
        niche:     currentProject.niche || "",
        audience:  currentProject.audience || "",
        tone:      $("tone").value,
        language:  $("language").value,
        topic,
        extra:     $("extra").value.trim(),
        platforms: selected,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Xato");

    const parsed = parseContent(data.content, selected);
    renderResults(parsed, selected);

    await sb.from("contents").insert({
      user_id:    currentUser.id,
      project_id: currentProject.id,
      topic,
      platforms:  selected,
      result:     parsed,
    });
  } catch (err) {
    showErr("errorBox", "Xato: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "✦ Kontent yaratish";
  }
});

function parseContent(text, platforms) {
  const keys = {
    threads:"THREADS POST", instagram:"INSTAGRAM KARUSEL",
    telegram:"TELEGRAM POST", reels:"REELS",
  };
  const result = {};
  platforms.forEach((pid, i) => {
    const key   = keys[pid] || pid.toUpperCase();
    const regex = new RegExp(`##\\s*${key}[^\\n]*\\n([\\s\\S]*?)(?=##\\s*[A-Z]|$)`,"i");
    const m     = text.match(regex);
    result[pid] = m ? m[1].trim()
      : (text.split(/##\s+/)[i+1]||text).replace(/^[A-Z\s\/()0-9]+\n/,"").trim();
  });
  return result;
}

function renderResults(parsed, platforms) {
  const wrap = $("results");
  wrap.innerHTML = '<div class="text-sm success" style="margin-bottom:12px">✅ Tayyor — tarixga saqlandi</div>';
  platforms.forEach(pid => {
    const info = CONFIG.platforms.find(p => p.id === pid) || { emoji:"", name:pid };
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-header">
        <div class="result-platform">${info.emoji} ${info.name}</div>
        <button class="copy-btn" id="copy-${pid}">Nusxa</button>
      </div>
      <pre class="result-body">${parsed[pid]||""}</pre>
    `;
    wrap.appendChild(card);
    card.querySelector(`#copy-${pid}`).addEventListener("click", () => {
      navigator.clipboard.writeText(parsed[pid]||"").catch(()=>{});
      const b = card.querySelector(`#copy-${pid}`);
      b.textContent="✓ Nusxalandi"; b.classList.add("copied");
      clearTimeout(copyTimers[pid]);
      copyTimers[pid] = setTimeout(()=>{ b.textContent="Nusxa"; b.classList.remove("copied"); },2000);
    });
  });
  wrap.scrollIntoView({ behavior:"smooth" });
}

async function loadHistory() {
  if (!currentProject) { $("historyList").innerHTML=""; show("historyEmpty"); return; }
  const { data } = await sb.from("contents")
    .select("*")
    .eq("project_id", currentProject.id)
    .order("created_at", { ascending: false });

  if (!data || !data.length) { $("historyList").innerHTML=""; show("historyEmpty"); return; }
  hide("historyEmpty");
  const list = $("historyList");
  list.innerHTML = "";
  data.forEach(item => {
    const platforms = (item.platforms||[]).map(pid => {
      const p = CONFIG.platforms.find(x => x.id===pid);
      return p ? p.emoji : pid;
    }).join(" ");
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-topic">${item.topic}</div>
      <div class="history-meta"><span>${platforms}</span><span>${fmt(item.created_at)}</span></div>
      <div class="history-detail" id="hd-${item.id}"></div>
    `;
    div.addEventListener("click", () => {
      div.classList.toggle("open");
      const detail = $("hd-"+item.id);
      if (div.classList.contains("open") && !detail.innerHTML) {
        const result = item.result || {};
        (item.platforms||[]).forEach(pid => {
          if (!result[pid]) return;
          const info = CONFIG.platforms.find(p=>p.id===pid)||{emoji:"",name:pid};
          const card = document.createElement("div");
          card.className = "result-card";
          card.style.marginTop = "10px";
          card.innerHTML = `
            <div class="result-header">
              <div class="result-platform">${info.emoji} ${info.name}</div>
              <button class="copy-btn hcopy">Nusxa</button>
            </div>
            <pre class="result-body">${result[pid]}</pre>
          `;
          card.querySelector(".hcopy").addEventListener("click", e => {
            e.stopPropagation();
            navigator.clipboard.writeText(result[pid]).catch(()=>{});
            const b = card.querySelector(".hcopy");
            b.textContent="✓ Nusxalandi"; b.classList.add("copied");
            setTimeout(()=>{ b.textContent="Nusxa"; b.classList.remove("copied"); },2000);
          });
          detail.appendChild(card);
        });
      }
    });
    list.appendChild(div);
  });
}

$("changePasswordBtn").addEventListener("click", async () => {
  const pw  = $("newPassword").value;
  const pw2 = $("newPasswordConfirm").value;
  hideErr("pwError"); hide("pwSuccess");
  if (pw.length < 6) { showErr("pwError","Kamida 6 belgi"); return; }
  if (pw !== pw2)    { showErr("pwError","Parollar mos emas"); return; }
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) showErr("pwError", error.message);
  else { show("pwSuccess"); $("newPassword").value=""; $("newPasswordConfirm").value=""; }
});

async function logout() {
  await sb.auth.signOut();
  currentUser=null; currentProject=null; projects=[];
}
$("logoutBtn").addEventListener("click", logout);
$("settingsLogout").addEventListener("click", logout);

function bindEvents() {
  $("newProjectModal").addEventListener("click", e => {
    if (e.target===$("newProjectModal")) hide("newProjectModal");
  });
  $("deleteModal").addEventListener("click", e => {
    if (e.target===$("deleteModal")) { hide("deleteModal"); deleteTargetId=null; }
  });
  $("projectName").addEventListener("keydown", e => {
    if (e.key==="Enter") $("saveProjectBtn").click();
  });
}

init();
