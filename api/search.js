const axios = require("axios");
const { cors, headers, HOST } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, type = "video", limit = "10" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing ?q=  Example: /api/search?q=Blinding+Lights" });

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
      const title = video.title?.runs?.[0]?.text || video.title?.simpleText || (typeof video.title === "string" ? video.title : "Unknown");
      const channel = video.author?.title || video.shortBylineText?.runs?.[0]?.text || "Unknown";
      results.push({
        videoId,
        title,
        channel,
        duration:      video.lengthText?.simpleText || null,
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
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
