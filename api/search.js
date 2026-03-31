const axios = require("axios");
const { setCors } = require("./_utils");

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "youtube138.p.rapidapi.com";
const BASE_URL      = `https://${RAPIDAPI_HOST}`;

function rapidHeaders() {
  return {
    "x-rapidapi-key":  RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type":    "application/json",
  };
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { q, type = "video", limit = "10" } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Missing 'q' query param",
      example: "/api/search?q=Blinding+Lights&type=video&limit=5",
    });
  }

  const maxResults = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

  try {
    const response = await axios.get(`${BASE_URL}/search/`, {
      params: {
        q,
        hl:   "en",
        gl:   "US",
        type, // video | channel | playlist
      },
      headers: rapidHeaders(),
    });

    const raw     = response.data?.contents || [];
    const results = [];

    for (const item of raw) {
      if (results.length >= maxResults) break;

      // Search results come wrapped in different keys
      const video =
        item?.video ||
        item?.videoRenderer ||
        item?.compactVideoRenderer;

      if (!video) continue;

      const videoId =
        video.videoId ||
        video.id;

      if (!videoId) continue;

      const title =
        video.title?.runs?.[0]?.text ||
        video.title?.simpleText ||
        video.title ||
        "Unknown";

      const channel =
        video.author?.title ||
        video.shortBylineText?.runs?.[0]?.text ||
        video.ownerText?.runs?.[0]?.text ||
        "Unknown";

      const duration =
        video.lengthText?.simpleText ||
        video.lengthText?.runs?.[0]?.text ||
        video.length?.simpleText ||
        null;

      const views =
        video.shortViewCountText?.simpleText ||
        video.viewCountText?.simpleText ||
        null;

      const thumbnail =
        video.thumbnail?.thumbnails?.at(-1)?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const publishedTime =
        video.publishedTimeText?.simpleText ||
        null;

      results.push({
        videoId,
        title,
        channel,
        duration,
        views,
        publishedTime,
        thumbnail,
        url:         `https://www.youtube.com/watch?v=${videoId}`,
        downloadMp4: `/api/download/mp4?url=${videoId}&quality=best`,
        downloadMp3: `/api/download/mp3?url=${videoId}`,
      });
    }

    return res.status(200).json({
      query:   q,
      type,
      count:   results.length,
      results,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error:   "Search failed",
      details: err.response?.data || err.message,
    });
  }
};
