const { cors, ytGet } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, videos, pageToken, maxResults = 12 } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ?id=  Example: /api/channel?id=UCxxxxxxx" });

  try {
    // Get channel details
    const ch = await ytGet("channels", { part: "snippet,statistics,brandingSettings", id });
    if (!ch.items?.length) return res.status(404).json({ error: "Channel not found" });
    const c = ch.items[0];

    const result = {
      channelId: c.id,
      name: c.snippet.title,
      description: c.snippet.description,
      handle: c.snippet.customUrl || "",
      country: c.snippet.country || "",
      subscribers: c.statistics.subscriberCount,
      views: c.statistics.viewCount,
      videoCount: c.statistics.videoCount,
      thumbnail: c.snippet.thumbnails?.high?.url,
      banner: c.brandingSettings?.image?.bannerExternalUrl || "",
    };

    // Optionally list videos
    if (videos === "true") {
      const vids = await ytGet("search", {
        part: "snippet", channelId: id, type: "video",
        order: "date", maxResults, pageToken: pageToken || undefined,
      });
      result.videos = vids.items.map(i => ({
        videoId: i.id.videoId,
        title: i.snippet.title,
        published: i.snippet.publishedAt,
        thumbnail: i.snippet.thumbnails?.high?.url,
      }));
      result.nextPageToken = vids.nextPageToken || null;
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
