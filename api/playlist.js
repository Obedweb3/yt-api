const { cors, get } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, nextToken } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ?id=  Example: /api/playlist?id=PLxxxxxxx" });

  try {
    const params = { playlistId: id };
    if (nextToken) params.nextToken = nextToken;
    const data = await get("/playlist/details", params);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
