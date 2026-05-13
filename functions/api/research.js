const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseHashtags(str) {
  return str.split(/[\s,،]+/)
    .map(h => h.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g,"").toLowerCase())
    .filter(h => h.length > 0)
    .slice(0, 5);
}

function toNum(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const s = val.replace(/[,\s]/g,"");
    if (s.endsWith("M")) return parseFloat(s)*1000000;
    if (s.endsWith("K")) return parseFloat(s)*1000;
    return parseInt(s)||0;
  }
  return 0;
}

// ── YOUTUBE — Google API orqali ──
async function searchYoutube(query, contentType, count, minViews, apiKey) {
  const videoDuration = contentType === "shorts" ? "short" : "any";
  const searchQuery   = contentType === "shorts" ? query + " shorts" : query;

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part",         "snippet");
  url.searchParams.set("q",            searchQuery);
  url.searchParams.set("type",         "video");
  url.searchParams.set("order",        "viewCount");
  url.searchParams.set("videoDuration", videoDuration);
  url.searchParams.set("maxResults",   "50");
  url.searchParams.set("key",          apiKey);

  const searchRes  = await fetch(url.toString());
  const searchData = await searchRes.json();
  if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube API xatosi");

  const items = searchData.items || [];
  if (!items.length) return [];

  // Video statistikasini olish
  const ids      = items.map(i => i.id?.videoId).filter(Boolean).join(",");
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "statistics,contentDetails");
  statsUrl.searchParams.set("id",   ids);
  statsUrl.searchParams.set("key",  apiKey);

  const statsRes  = await fetch(statsUrl.toString());
  const statsData = await statsRes.json();
  const statsMap  = {};
  (statsData.items||[]).forEach(v => { statsMap[v.id] = v; });

  return items.map(item => {
    const videoId = item.id?.videoId;
    const stats   = statsMap[videoId]?.statistics || {};
    const views   = toNum(stats.viewCount);
    return {
      title:       item.snippet?.title || "Video",
      views,
      likes:       toNum(stats.likeCount),
      url:         `https://youtube.com/watch?v=${videoId}`,
      contentType: contentType || "video",
      platform:    "youtube",
    };
  }).filter(r => r.title.length > 2 && r.url.includes("watch?v="));
}

// ── INSTAGRAM — Apify orqali ──
async function runApifyActor(actorId, inputData, apiKey) {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
    { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(inputData) }
  );
  const runData = await runRes.json();
  if (!runRes.ok) throw new Error(runData.error?.message || "Apify xatosi");

  const runId = runData.data.id;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes  = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
    const statusData = await statusRes.json();
    const status     = statusData.data?.status;
    if (status === "SUCCEEDED") {
      const datasetRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}&limit=100`
      );
      const items = await datasetRes.json();
      return Array.isArray(items) ? items : [];
    }
    if (status === "FAILED" || status === "ABORTED") throw new Error("Apify actor ishlamadi");
  }
  throw new Error("Vaqt tugadi — qayta urinib ko'ring");
}

function filterInstagram(items, contentType) {
  return items.filter(item => {
    const isVideo   = item.isVideo===true  || item.type==="GraphVideo"   || item.mediaType==="VIDEO";
    const isAlbum   = item.isAlbum===true  || item.type==="GraphSidecar" || item.mediaType==="CAROUSEL_ALBUM";
    if (contentType === "reels")    return isVideo;
    if (contentType === "carousel") return isAlbum;
    if (contentType === "post")     return !isVideo && !isAlbum;
    return true;
  }).map(item => {
    const isVideo = item.isVideo===true || item.type==="GraphVideo";
    return {
      title:       (item.caption||item.alt||"Post").replace(/\n/g," ").slice(0,150),
      views:       isVideo
        ? (toNum(item.videoViewCount)||toNum(item.videoPlayCount)||toNum(item.playsCount)||toNum(item.likesCount)||0)
        : toNum(item.likesCount)||0,
      likes:       toNum(item.likesCount)||0,
      url:         item.url||(item.shortCode?`https://instagram.com/p/${item.shortCode}`:""),
      contentType: contentType||"post",
      platform:    "instagram",
    };
  }).filter(r => r.title.length > 2);
}

// ── THREADS — Apify orqali ──
function formatThreads(items, contentType) {
  return items.map(item => ({
    title:       (item.text||item.content||item.caption||"Post").replace(/\n/g," ").slice(0,150),
    views:       toNum(item.viewsCount)||toNum(item.repostsCount)||toNum(item.likesCount)||0,
    likes:       toNum(item.likesCount)||0,
    url:         item.url||item.link||"",
    contentType: contentType||"post",
    platform:    "threads",
  })).filter(r => r.title.length > 2);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { platform, contentType, niche, count=5, minViews=0 } = await request.json();

    if (!platform || !niche)
      return Response.json({ error:"Platforma va hashtag kerak" },{ status:400, headers:CORS });

    const hashtags = parseHashtags(niche);
    if (!hashtags.length)
      return Response.json({ error:"Hashtag noto'g'ri" },{ status:400, headers:CORS });

    let results = [];

    // ── YOUTUBE ──
    if (platform === "youtube") {
      if (!env.YOUTUBE_API_KEY) throw new Error("YouTube API kalit kiritilmagan");
      results = await searchYoutube(
        hashtags.join(" "),
        contentType,
        count,
        minViews,
        env.YOUTUBE_API_KEY
      );

    // ── INSTAGRAM ──
    } else if (platform === "instagram") {
      if (!env.APIFY_API_KEY) throw new Error("Apify API kalit kiritilmagan");
      const rawItems = await runApifyActor(
        "apify~instagram-hashtag-scraper",
        {
          hashtags,
          resultsLimit: Math.max(100, count*10),
          proxy: { useApifyProxy:true, apifyProxyGroups:["RESIDENTIAL"] },
        },
        env.APIFY_API_KEY
      );
      results = filterInstagram(rawItems, contentType);

    // ── THREADS ──
    } else if (platform === "threads") {
      if (!env.APIFY_API_KEY) throw new Error("Apify API kalit kiritilmagan");
      const rawItems = await runApifyActor(
        "apify~threads-scraper",
        {
          queries:      hashtags,
          resultsLimit: Math.max(50, count*5),
          proxy: { useApifyProxy:true },
        },
        env.APIFY_API_KEY
      );
      results = formatThreads(rawItems, contentType);
    }

    // Ko'p prosmotr bo'yicha saralash
    results.sort((a,b) => b.views - a.views);

    // MinViews filtri
    let filtered = minViews > 0 ? results.filter(r => r.views >= minViews) : results;

    let warning = "";
    if (minViews > 0 && filtered.length === 0 && results.length > 0) {
      filtered = results;
      const label = minViews >= 1000000
        ? (minViews/1000000)+"M"
        : (minViews/1000)+"K";
      warning = `${label}+ prosmotrli natija topilmadi — eng yaxshi natijalar ko'rsatildi`;
    }
    if (results.length === 0) {
      warning = "Natija topilmadi — boshqa hashtag sinab ko'ring";
    }

    return Response.json({
      results: filtered.slice(0, count),
      warning,
      total:   results.length,
    }, { headers:CORS });

  } catch(err) {
    return Response.json({ error:err.message },{ status:500, headers:CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers:CORS });
}
