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

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { platform, contentType, niche, count = 5, minViews = 0 } = await request.json();

    if (!platform || !niche) {
      return Response.json(
        { error: "Platforma va hashtag kerak" },
        { status: 400, headers: CORS }
      );
    }

    const hashtags = parseHashtags(niche);
    if (!hashtags.length) {
      return Response.json(
        { error: "Hashtag noto'g'ri formatda" },
        { status: 400, headers: CORS }
      );
    }

    let actorId   = "";
    let inputData = {};

    if (platform === "instagram") {
      actorId = "apify~instagram-hashtag-scraper";
      inputData = {
        hashtags,
        resultsLimit: count * 4,
      };
    } else if (platform === "youtube") {
      actorId = "streamers~youtube-scraper";
      inputData = {
        searchKeywords: hashtags.join(" "),
        maxResults:     count * 4,
        sortBy:         "VIEW_COUNT",
      };
    } else if (platform === "threads") {
      actorId = "apify~threads-scraper";
      inputData = {
        queries:      hashtags,
        resultsLimit: count * 4,
      };
    } else {
      return Response.json(
        { error: "Noto'g'ri platforma" },
        { status: 400, headers: CORS }
      );
    }

    // Actor ishga tushirish
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${env.APIFY_API_KEY}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(inputData),
      }
    );
    const runData = await runRes.json();
    if (!runRes.ok) throw new Error(runData.error?.message || "Apify ishga tushmadi");

    const runId = runData.data.id;

    // Natija kutish (max 30 sek)
    let items = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const statusRes  = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_API_KEY}`
      );
      const statusData = await statusRes.json();
      const status     = statusData.data.status;

      if (status === "SUCCEEDED") {
        const datasetRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${env.APIFY_API_KEY}&limit=${count * 4}`
        );
        items = await datasetRes.json();
        break;
      }
      if (status === "FAILED" || status === "ABORTED") {
        throw new Error("Apify actor ishlamadi — boshqa hashtag sinab ko'ring");
      }
    }

    // Formatlash
    let results = items.map(item => {
      if (platform === "instagram") {
        const views = item.videoViewCount || item.likesCount || 0;
        return {
          title:       item.caption?.slice(0, 150) || "#" + hashtags[0],
          views,
          likes:       item.likesCount  || 0,
          url:         item.shortCode
            ? `https://instagram.com/p/${item.shortCode}`
            : (item.url || ""),
          contentType: contentType || "reels",
          platform:    "instagram",
        };
      } else if (platform === "youtube") {
        return {
          title:       item.title || "Video",
          views:       item.viewCount  || 0,
          likes:       item.likeCount  || 0,
          url:         item.url || "",
          contentType: contentType || "shorts",
          platform:    "youtube",
        };
      } else {
        return {
          title:       item.text?.slice(0, 150) || "Post",
          views:       item.likesCount || 0,
          likes:       item.likesCount || 0,
          url:         item.url || "",
          contentType: contentType || "post",
          platform:    "threads",
        };
      }
    });

    // Minimal prosmotr filtri
    if (minViews > 0) {
      results = results.filter(r => r.views >= minViews);
    }

    // Ko'p prosmotr bo'yicha saralash
    results.sort((a, b) => b.views - a.views);

    // Kerakli sondagi natija
    results = results.slice(0, count);

    return Response.json({ results }, { headers: CORS });

  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: CORS }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
