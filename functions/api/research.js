const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { platform, niche, count = 5 } = await request.json();

    if (!platform || !niche) {
      return Response.json(
        { error: "Platforma va nisha kerak" },
        { status: 400, headers: CORS }
      );
    }

    const actorMap = {
      instagram: "apify/instagram-reel-scraper",
      youtube:   "streamers/youtube-scraper",
      threads:   "apify/threads-scraper",
    };

    const actor = actorMap[platform];
    if (!actor) {
      return Response.json(
        { error: "Noto'g'ri platforma" },
        { status: 400, headers: CORS }
      );
    }

    let inputData = {};
    if (platform === "instagram") {
      inputData = {
        hashtags: [niche.replace(/\s+/g, "").toLowerCase()],
        resultsLimit: count,
        sortReelsBy: "TOP",
      };
    } else if (platform === "youtube") {
      inputData = {
        searchKeywords: niche,
        maxResults: count,
        sortBy: "VIEW_COUNT",
      };
    } else if (platform === "threads") {
      inputData = {
        queries: [niche],
        resultsLimit: count,
      };
    }

    // Run actor
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/runs?token=${env.APIFY_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      }
    );
    const runData = await runRes.json();
    if (!runRes.ok) throw new Error(runData.error?.message || "Apify xatosi");

    const runId = runData.data.id;

    // Wait for result (max 30 sec)
    let items = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_API_KEY}`
      );
      const statusData = await statusRes.json();
      const status = statusData.data.status;

      if (status === "SUCCEEDED") {
        const datasetRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${env.APIFY_API_KEY}&limit=${count}`
        );
        const dataset = await datasetRes.json();
        items = dataset;
        break;
      }
      if (status === "FAILED" || status === "ABORTED") {
        throw new Error("Apify actor xato berdi");
      }
    }

    // Format results
    const results = items.slice(0, count).map(item => {
      if (platform === "instagram") {
        return {
          title:    item.caption?.slice(0, 100) || "Sarlavsiz",
          views:    item.videoPlayCount || item.likesCount || 0,
          likes:    item.likesCount || 0,
          url:      item.url || "",
          platform: "instagram",
        };
      } else if (platform === "youtube") {
        return {
          title:    item.title || "Sarlavsiz",
          views:    item.viewCount || 0,
          likes:    item.likeCount || 0,
          url:      item.url || "",
          platform: "youtube",
        };
      } else {
        return {
          title:    item.text?.slice(0, 100) || "Sarlavsiz",
          views:    item.likesCount || 0,
          likes:    item.likesCount || 0,
          url:      item.url || "",
          platform: "threads",
        };
      }
    });

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
