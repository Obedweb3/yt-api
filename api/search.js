const axios = require("axios");

const HOST = "youtube138.p.rapidapi.com";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function headers() {
  return {
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": HOST,
    "Content-Type": "application/json",
  };
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, type = "video", limit = "10" } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Missing 'q' param",
      example: "/api/search?q=Blinding+Lights&limit=5",
    });
  }

  const maxResults = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

  try {
    const { data } = await axios.get(`https://${HOST}/search/`, {
      params: { q, hl: "en", gl: "US", type },
      headers: headers(),
    });

    const raw = data?.contents || [];
    const results = [];

    for (const item of raw) {
      if (results.length >= maxResults) break;

      const video = item?.video || item?.videoRenderer || item?.compactVideoRenderer;
      if (!video) continue;

      const videoId = video.videoId || video.id;
      if (!videoId) continue;

      const title =
        video.title?.runs?.[0]?.text ||
        video.title?.simpleText ||
        (typeof video.title === "string" ? video.title : "Unknown");

      const channel =
        video.author?.title ||
        video.shortBylineText?.runs?.[0]?.text ||
        video.ownerText?.runs?.[0]?.text ||
        "Unknown";

      results.push({
        videoId,
        title,
        channel,
        duration:      video.lengthText?.simpleText || video.length?.simpleText || null,
        views:         video.shortViewCountText?.simpleText || null,
        publishedTime: video.publishedTimeText?.simpleText || null,
        thumbnail:     video.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        youtubeUrl:    `https://www.youtube.com/watch?v=${videoId}`,
        downloadMp4:   `/api/download-mp4?url=${videoId}&quality=best`,
        downloadMp3:   `/api/download-mp3?url=${videoId}`,
      });
    }

    return res.status(200).json({ query: q, count: results.length, results });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: "Search failed",
      details: err.response?.data || err.message,
    });
  }
};
