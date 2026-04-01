const { cors, get } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, nextToken, type, duration, uploadDate, sortBy } = req.query;
  if (!q) return res.status(400).json({ error: "Missing ?q=  Example: /api/search?q=lofi+music" });

  try {
    const params = { keyword: q };
    if (nextToken) params.nextToken = nextToken;
    if (type) params.type = type;           // video, channel, playlist, etc.
    if (duration) params.duration = duration; // short, long
    if (uploadDate) params.uploadDate = uploadDate;
    if (sortBy) params.sortBy = sortBy;     // relevance, date, views, rating
    const data = await get("/search", params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
