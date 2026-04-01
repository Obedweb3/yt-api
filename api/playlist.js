const { cors, ytGet } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, pageToken, maxResults = 20 } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ?id=  Example: /api/playlist?id=PLxxxxxxx" });

  try {
    // Playlist details
    const pl = await ytGet("playlists", { part: "snippet,contentDetails", id });
    if (!pl.items?.length) return res.status(404).json({ error: "Playlist not found" });
    const p = pl.items[0];

    // Playlist videos
    const items = await ytGet("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: id,
      maxResults,
      pageToken: pageToken || undefined,
    });

    return res.status(200).json({
      playlistId: id,
      title: p.snippet.title,
      description: p.snippet.description,
      channel: p.snippet.channelTitle,
      channelId: p.snippet.channelId,
      videoCount: p.contentDetails.itemCount,
      thumbnail: p.snippet.thumbnails?.high?.url,
      nextPageToken: items.nextPageToken || null,
      prevPageToken: items.prevPageToken || null,
      videos: items.items.map(i => ({
        videoId: i.contentDetails.videoId,
        title: i.snippet.title,
        position: i.snippet.position,
        published: i.contentDetails.videoPublishedAt,
        thumbnail: i.snippet.thumbnails?.high?.url,
      })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
