const { cors, extractId, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { url, sortBy = "top", nextToken, lang = "en-US" } = req.query;
  if (!url && !nextToken) return res.status(400).json({ error: "Missing ?url= (or ?nextToken= for pagination)" });
  const params = { lang, sortBy };
  if (nextToken) { params.nextToken = nextToken; }
  else {
    const videoId = extractId(url);
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });
    params.videoId = videoId;
  }
  try {
    const data = await get("/video/comments", params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
