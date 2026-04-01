const { cors, extractId, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { url, urlAccess = "normal", lang = "en-US" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });
  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });
  try {
    const data = await get("/video/details", { videoId, urlAccess, lang });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
