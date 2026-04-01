const { cors, ytGet } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, pageToken, maxResults = 12, type = "video", order = "relevance", videoDuration } = req.query;
  if (!q) return res.status(400).json({ error: "Missing ?q=  Example: /api/search?q=lofi+music" });

  try {
    const params = { part: "snippet", q, maxResults, type, order, pageToken: pageToken || undefined };
    if (videoDuration) params.videoDuration = videoDuration; // short | medium | long
    const data = await ytGet("search", params);

    return res.status(200).json({
      nextPageToken: data.nextPageToken || null,
      prevPageToken: data.prevPageToken || null,
      totalResults: data.pageInfo?.totalResults,
      results: data.items.map(i => ({
        videoId: i.id?.videoId || i.id?.playlistId || i.id?.channelId,
        type: i.id?.kind?.replace("youtube#", ""),
        title: i.snippet.title,
        channel: i.snippet.channelTitle,
        channelId: i.snippet.channelId,
        published: i.snippet.publishedAt,
        description: i.snippet.description,
        thumbnail: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.default?.url,
      })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
