const { extractVideoId, fetchVideoInfo, setCors } = require("../_utils");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { url, quality = "best" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing 'url' query param" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchVideoInfo(videoId);
    const sd   = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const all = [
      ...(sd.formats || []),
      ...(sd.adaptiveFormats || []),
    ].filter(f => f.mimeType?.includes("video/mp4") && f.url);

    let chosen;
    if (quality === "best") {
      chosen = all.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    } else {
      const h = parseInt(quality);
      chosen  = all.find(f => f.height === h)
             || all.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    }

    if (!chosen) return res.status(404).json({ error: "No MP4 format found" });

    return res.status(200).json({
      videoId,
      title:       data.title,
      quality:     chosen.qualityLabel,
      mime:        chosen.mimeType,
      width:       chosen.width,
      height:      chosen.height,
      itag:        chosen.itag,
      downloadUrl: chosen.url,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error:   "Failed to get MP4 download",
      details: err.response?.data || err.message,
    });
  }
};
