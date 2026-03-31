const { extractVideoId, fetchVideoInfo, setCors } = require("./_utils");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing 'url' query param" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const d = await fetchVideoInfo(videoId);
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
    return res.status(err.response?.status || 500).json({
      error:   "Failed to fetch video info",
      details: err.response?.data || err.message,
    });
  }
};
