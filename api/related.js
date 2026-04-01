const { cors, extractId, get } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, nextToken } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/related?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const params = { videoId };
    if (nextToken) params.nextToken = nextToken;
    const data = await get("/video/related", params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
