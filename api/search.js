const { cors, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { q, searchType = "videos", sortBy = "relevance", duration, uploadDate, nextToken, lang = "en-US" } = req.query;
  if (!q && !nextToken) return res.status(400).json({ error: "Missing ?q= (or ?nextToken= for pagination). Add &searchType=videos|channels|playlists" });
  // Route to correct sub-endpoint
  const pathMap = { videos: "/search/videos", channels: "/search/channels", playlists: "/search/playlists" };
  const path = pathMap[searchType] || "/search/videos";
  const params = { lang };
  if (nextToken) { params.nextToken = nextToken; }
  else {
    params.keyword = q;
    if (sortBy) params.sortBy = sortBy;
    if (duration && searchType === "videos") params.duration = duration;
    if (uploadDate && searchType === "videos") params.uploadDate = uploadDate;
  }
  try {
    const data = await get(path, params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
