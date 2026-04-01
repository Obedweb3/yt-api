const { cors, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { id, videos = "false", nextToken, lang = "en-US" } = req.query;
  if (!id && !nextToken) return res.status(400).json({ error: "Missing ?id= playlist ID (e.g. PLxxxxx). Add &videos=true to list videos." });
  try {
    if (videos === "true") {
      const params = { lang };
      if (nextToken) params.nextToken = nextToken;
      else params.playlistId = id;
      const data = await get("/playlist/videos", params);
      return res.status(200).json(data);
    }
    const data = await get("/playlist/details", { playlistId: id, lang });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
