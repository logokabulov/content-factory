const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseHashtags(str) {
  return str.split(/[\s,،]+/)
    .map(h => h.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, "").toLowerCase())
    .filter(h => h.length > 0)
    .slice(0, 5);
}

async function runActor(actorId, inputData, apiKey) {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(inputData),
    }
  );
  const runData = await runRes.json();
  if (!runRes.ok) throw new Error(runData.error?.message || "Actor ishga tushmadi");

  const runId = runData.data.id;

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes  = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );
    const statusData = await statusRes.json();
    const status     = statusData.data?.status;

    if (status === "SUCCEEDED") {
      const datasetRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}&limit=100`
      );
      const items = await datasetRes.json();
      return Array.isArray(items) ? items : [];
    }
    if (status === "FAILED" || status === "ABORTED") {
      throw new Error("Actor muvaffaqiyatsiz tugadi");
    }
  }
  throw new Error("Vaqt tugadi — qayta urinib ko'ring");
}

function toNum(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const s = val.replace(/[,\s]/g, "");
    if (s.endsWith("M")) return parseFloat(s) * 1000000;
    if (s.endsWith("K")) return parseFloat(s) * 1000;
    return parseInt(s) || 0;
  }
  return 0;
}

function formatInstagram(items, contentType, hashtags) {
  return items.map(item => {
    const views = toNum(item.videoViewCount)
      || toNum(item.videoPlayCount)
      || toNum(item.playsCount)
      || toNum(item.likesCount)
      || 0;
    const title = (item.caption || item.alt || item.hashtags?.join(" ") || "#" + hashtags[0])
      .replace(/\n/g, " ").slice(0, 150);
    const url = item.url || (item.shortCode ? `https://instagram.com/p/${item.shortCode}` : "");
    return {
      title,
      views,
      likes:       toNum(item.likesCount) || 0,
      url,
      contentType: contentType || "reels",
      platform:    "instagram",
    };
  }).filter(r => r.title.length > 2);
}

function formatYoutube(items, contentType) {
  return items.map(item => {
    const views = toNum(item.viewCount)
      || toNum(item.views)
      || toNum(item.statistics?.viewCount)
      || 0;
    const url = item.url
      || item.link
      || (item.id ? `https://youtube.com/watch?v=${item.id}` : "")
      || (item.videoId ? `https://youtube.com/watch?v=${item.videoId}` : "");
    return {
      title:       (item.title || item.name || "Video").slice(0, 150),
      views,
      likes:       toNum(item.likeCount) || toNum(item.likes) || toNum(item.statistics?.likeCount) || 0,
      url,
      contentType: contentType || "shorts",
      platform:    "youtube",
    };
  }).filter(r => r.title.length > 2);
}

function formatThreads(items, contentType) {
  return items.map(item => {
    const text = (item.text || item.content || item.caption || "Post")
      .replace(/\n/g, " ").slice(0, 150);
    const views = toNum(item.viewsCount)
      || toNum(item.repostsCount)
      || toNum(item.likesCount)
      || 0;
    return {
      title:       text,
      views,
      likes:       toNum(item.likesCount) || 0,
      url:         item.url || item.link || "",
      contentType: contentType || "post",
      platform:    "threads",
    };
  }).filter(r => r.title.length > 2);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { platform, contentType, niche, count = 5, minViews = 0 } = await request.json();

    if (!platform || !niche) {
      return Response.json({ error: "Platforma va hashtag kerak" }, { status: 400, headers: CORS });
    }

    const hashtags = parseHashtags(niche);
    if (!hashtags.length) {
      return Response.json({ error: "Hashtag noto'g'ri" }, { status: 400, headers: CORS });
    }

    let rawItems = [];
    let results  = [];

    if (platform === "instagram") {
      rawItems = await runActor(
        "apify~instagram-hashtag-scraper",
        {
          hashtags,
          resultsLimit: Math.max(50, count * 5),
          proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
        },
        env.APIFY_API_KEY
      );
      results = formatInstagram(rawItems, contentType, hashtags);

    } else if (platform === "youtube") {
      // 1-actor sinab ko'ramiz
      try {
        rawItems = await runActor(
          "streamers~youtube-scraper",
          {
            searchKeywords: hashtags.join(" "),
            maxResults:     Math.max(50, count * 5),
            sortBy:         "VIEW_COUNT",
            proxy: { useApifyProxy: true },
          },
          env.APIFY_API_KEY
        );
      } catch {
        // Backup actor
        rawItems = await runActor(
          "apify~youtube-scraper",
          {
            searchKeywords: hashtags.join(" "),
            maxResults:     Math.max(50, count * 5),
            proxy: { useApifyProxy: true },
          },
          env.APIFY_API_KEY
        );
      }
      results = formatYoutube(rawItems, contentType);

    } else if (platform === "threads") {
      rawItems = await runActor(
        "apify~threads-scraper",
        {
          queries:      hashtags,
          resultsLimit: Math.max(50, count * 5),
          proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
        },
        env.APIFY_API_KEY
      );
      results = formatThreads(rawItems, contentType);
    }

    // Ko'p prosmotr bo'yicha saralash
    results.sort((a, b) => b.views - a.views);

    // MinViews filtri
    let filtered = minViews > 0
      ? results.filter(r => r.views >= minViews)
      : results;

    // Agar filtrdan keyin bo'sh — barchasini qaytaramiz
    let warning = "";
    if (minViews > 0 && filtered.length === 0 && results.length > 0) {
      filtered = results;
      const label = minViews >= 1000000
        ? (minViews/1000000) + "M"
        : (minViews/1000) + "K";
      warning = `${label}+ prosmotrli natija topilmadi — eng yaxshi natijalar ko'rsatildi`;
    }

    if (filtered.length === 0) {
      warning = "Natija topilmadi — boshqa hashtag yoki platformani sinab ko'ring";
    }

    return Response.json({
      results: filtered.slice(0, count),
      warning,
      total: results.length,
    }, { headers: CORS });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
