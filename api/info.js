const { cors, extractId, ytGet } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/info?url=dQw4w9WgXcQ" });
  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await ytGet("videos", {
      part: "snippet,contentDetails,statistics,status",
      id: videoId,
    });

    if (!data.items?.length) return res.status(404).json({ error: "Video not found" });
    const v = data.items[0];

    return res.status(200).json({
      videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      channel: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      published: v.snippet.publishedAt,
      tags: v.snippet.tags || [],
      duration: v.contentDetails.duration, // ISO 8601 e.g. PT4M13S
      definition: v.contentDetails.definition, // hd or sd
      caption: v.contentDetails.caption,
      views: v.statistics.viewCount,
      likes: v.statistics.likeCount,
      comments: v.statistics.commentCount,
      thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url,
      embeddable: v.status.embeddable,
      privacyStatus: v.status.privacyStatus,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
