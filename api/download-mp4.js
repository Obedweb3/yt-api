const { cors, extractId, fetchInfo } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, quality = "best" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/download-mp4?url=dQw4w9WgXcQ&quality=720" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchInfo(videoId);
    const sd = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const all = [...(sd.formats || []), ...(sd.adaptiveFormats || [])].filter(f => f.mimeType?.includes("video/mp4") && f.url);
    const chosen = quality === "best"
      ? all.sort((a, b) => (b.height || 0) - (a.height || 0))[0]
      : (all.find(f => f.height === parseInt(quality)) || all.sort((a, b) => (b.height || 0) - (a.height || 0))[0]);

    if (!chosen) return res.status(404).json({ error: "No MP4 format found" });

    return res.status(200).json({
      videoId, title: data.title, quality: chosen.qualityLabel, mime: chosen.mimeType,
      width: chosen.width, height: chosen.height, itag: chosen.itag,
      downloadUrl: chosen.url, streamUrl: `/api/stream?url=${videoId}&itag=${chosen.itag}`,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
