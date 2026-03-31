const { cors, extractId, fetchInfo } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/info?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const d = await fetchInfo(videoId);
    return res.status(200).json({
      videoId,
      title:       d.title,
      duration:    d.lengthSeconds,
      thumbnail:   d.thumbnail?.thumbnails?.at(-1)?.url,
      channel:     d.author?.title,
      channelId:   d.author?.channelId,
      viewCount:   d.viewCount,
      publishDate: d.publishDate,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
