const { cors, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { id, type = "videos", sortBy = "newest", nextToken, lang = "en-US" } = req.query;
  // type: videos | shorts | live | playlists | releases | podcasts
  if (!id && !nextToken) return res.status(400).json({ error: "Missing ?id= channel ID or handle (e.g. @MrBeast). Add &type=videos|shorts|live|playlists" });
  try {
    const isPlaylistType = ["playlists", "releases", "podcasts"].includes(type);
    const path = isPlaylistType ? "/channel/playlists" : "/channel/videos";
    const params = { lang };
    if (nextToken) { params.nextToken = nextToken; }
    else {
      params.channelId = id;
      params.type = type;
      params.sortBy = sortBy;
    }
    const data = await get(path, params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
