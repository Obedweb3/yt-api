const { cors, extractId, get } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, nextToken, sortBy } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/comments?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const params = { videoId };
    if (nextToken) params.nextToken = nextToken;
    if (sortBy) params.sortBy = sortBy; // top or newest
    const data = await get("/video/comments", params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
