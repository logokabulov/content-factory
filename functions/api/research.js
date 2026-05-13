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

async function runActor(actorId, inputData, apiKey) {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
    { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(inputData) }
  );
  const runData = await runRes.json();
  if (!runRes.ok) throw new Error(runData.error?.message || `Actor topilmadi: ${actorId}`);

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
    if (status === "FAILED" || status === "ABORTED") throw new Error("Actor muvaffaqiyatsiz tugadi");
  }
  throw new Error("Vaqt tugadi — qayta urinib ko'ring");
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

    // ── INSTAGRAM ──
    if (platform === "instagram") {
      if (contentType === "reels") {
        // Reels uchun maxsus actor
        const items = await runActor(
          "apify~instagram-reel-scraper",
          {
            hashtags,
            resultsLimit: Math.max(50, count*5),
            proxy: { useApifyProxy:true, apifyProxyGroups:["RESIDENTIAL"] },
          },
          env.APIFY_API_KEY
        );
        results = items.map(item => ({
          title:       (item.caption||item.alt||"#"+hashtags[0]).replace(/\n/g," ").slice(0,150),
          views:       toNum(item.videoPlayCount)||toNum(item.videoViewCount)||toNum(item.playsCount)||toNum(item.likesCount)||0,
          likes:       toNum(item.likesCount)||0,
          url:         item.url||(item.shortCode?`https://instagram.com/p/${item.shortCode}`:""),
          contentType: "reels",
          platform:    "instagram",
        })).filter(r=>r.title.length>2);

      } else {
        // Karusel va oddiy post uchun hashtag scraper
        const items = await runActor(
          "apify~instagram-hashtag-scraper",
          {
            hashtags,
            resultsLimit: Math.max(50, count*5),
            proxy: { useApifyProxy:true, apifyProxyGroups:["RESIDENTIAL"] },
          },
          env.APIFY_API_KEY
        );
        // Kontent turi bo'yicha filter
        results = items
          .filter(item => {
            if (contentType === "carousel") return item.type==="GraphSidecar" || item.isAlbum===true;
            if (contentType === "post")     return item.type==="GraphImage"   || (!item.isVideo && !item.isAlbum);
            return true;
          })
          .map(item => ({
            title:       (item.caption||"#"+hashtags[0]).replace(/\n/g," ").slice(0,150),
            views:       toNum(item.likesCount)||0,
            likes:       toNum(item.likesCount)||0,
            url:         item.url||(item.shortCode?`https://instagram.com/p/${item.shortCode}`:""),
            contentType: contentType||"post",
            platform:    "instagram",
          })).filter(r=>r.title.length>2);
      }

    // ── YOUTUBE ──
    } else if (platform === "youtube") {
      const searchQuery = contentType==="shorts"
        ? hashtags.join(" ") + " #shorts"
        : hashtags.join(" ");

      // Actor nomlarini navbatma-navbat sinab ko'ramiz
      const ytActors = [
        {
          id:    "apify~youtube-scraper",
          input: { searchKeywords:searchQuery, maxResults:Math.max(50,count*5) },
        },
        {
          id:    "bernardo~youtube-search-scraper",
          input: { searchTerms:[searchQuery], maxResultsPerSearch:Math.max(50,count*5) },
        },
      ];

      let rawItems = [];
      for (const actor of ytActors) {
        try {
          rawItems = await runActor(actor.id, actor.input, env.APIFY_API_KEY);
          if (rawItems.length > 0) break;
        } catch { continue; }
      }

      results = rawItems.map(item => ({
        title:       (item.title||item.name||"Video").slice(0,150),
        views:       toNum(item.viewCount)||toNum(item.views)||toNum(item.statistics?.viewCount)||0,
        likes:       toNum(item.likeCount)||toNum(item.likes)||toNum(item.statistics?.likeCount)||0,
        url:         item.url||item.link||(item.id?`https://youtube.com/watch?v=${item.id}`:"")||(item.videoId?`https://youtube.com/watch?v=${item.videoId}`:""),
        contentType: contentType||"shorts",
        platform:    "youtube",
      })).filter(r=>r.title.length>2);

    // ── THREADS ──
    } else if (platform === "threads") {
      const items = await runActor(
        "apify~threads-scraper",
        { queries:hashtags, resultsLimit:Math.max(50,count*5), proxy:{ useApifyProxy:true } },
        env.APIFY_API_KEY
      );
      results = items.map(item => ({
        title:       (item.text||item.content||item.caption||"Post").replace(/\n/g," ").slice(0,150),
        views:       toNum(item.viewsCount)||toNum(item.repostsCount)||toNum(item.likesCount)||0,
        likes:       toNum(item.likesCount)||0,
        url:         item.url||item.link||"",
        contentType: contentType||"post",
        platform:    "threads",
      })).filter(r=>r.title.length>2);
    }

    // Ko'p prosmotr bo'yicha saralash
    results.sort((a,b)=>b.views-a.views);

    // MinViews filtri
    let filtered = minViews>0 ? results.filter(r=>r.views>=minViews) : results;

    let warning = "";
    if (minViews>0 && filtered.length===0 && results.length>0) {
      filtered = results;
      const label = minViews>=1000000 ? (minViews/1000000)+"M" : (minViews/1000)+"K";
      warning = `${label}+ prosmotrli natija topilmadi — eng yaxshi natijalar ko'rsatildi`;
    }
    if (results.length===0) {
      warning = "Natija topilmadi — boshqa hashtag yoki platformani sinab ko'ring";
    }

    return Response.json({
      results: filtered.slice(0,count),
      warning,
      total: results.length,
    }, { headers:CORS });

  } catch(err) {
    return Response.json({ error:err.message },{ status:500, headers:CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers:CORS });
}
