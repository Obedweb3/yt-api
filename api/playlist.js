const { cors, ytGet } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, pageToken, maxResults = 20 } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ?id=  Example: /api/playlist?id=PLxxxxxxx" });

  try {
    // Step 1: playlist details
    const pl = await ytGet("playlists", { part: "snippet,contentDetails", id });
    if (!pl.items?.length) return res.status(404).json({ error: "Playlist not found" });
    const p = pl.items[0];

    // Step 2: playlist videos
    const itemsParams = {
      part: "snippet,contentDetails",
      playlistId: id,
      maxResults: Number(maxResults),
    };
    if (pageToken) itemsParams.pageToken = pageToken;
    const items = await ytGet("playlistItems", itemsParams);

    return res.status(200).json({
      playlistId: id,
      title: p.snippet?.title || "",
      description: p.snippet?.description || "",
      channel: p.snippet?.channelTitle || "",
      channelId: p.snippet?.channelId || "",
      videoCount: p.contentDetails?.itemCount || 0,
      thumbnail: p.snippet?.thumbnails?.high?.url || p.snippet?.thumbnails?.default?.url || null,
      nextPageToken: items.nextPageToken || null,
      prevPageToken: items.prevPageToken || null,
      videos: (items.items || []).map(i => ({
        videoId: i.contentDetails?.videoId || null,
        title: i.snippet?.title || "",
        position: i.snippet?.position ?? null,
        published: i.contentDetails?.videoPublishedAt || null,
        thumbnail: i.snippet?.thumbnails?.high?.url || i.snippet?.thumbnails?.default?.url || null,
        channel: i.snippet?.videoOwnerChannelTitle || "",
      })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
};
