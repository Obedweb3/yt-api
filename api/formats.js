const { cors, extractId, fetchInfo } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/formats?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchInfo(videoId);
    const sd = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const combined = (sd.formats || [])
      .filter(f => f.mimeType?.includes("mp4") && f.url)
      .map(f => ({ itag: f.itag, type: "video+audio", quality: f.qualityLabel, mime: f.mimeType, width: f.width, height: f.height, url: f.url }));

    const adaptive = (sd.adaptiveFormats || []).filter(f => f.url);
    const videoOnly = adaptive
      .filter(f => f.mimeType?.startsWith("video/mp4"))
      .map(f => ({ itag: f.itag, type: "video", quality: f.qualityLabel, mime: f.mimeType, width: f.width, height: f.height, bitrate: f.bitrate, url: f.url }));
    const audioOnly = adaptive
      .filter(f => f.mimeType?.startsWith("audio"))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      .map(f => ({ itag: f.itag, type: "audio", quality: f.audioQuality, mime: f.mimeType, bitrate: f.bitrate, sampleRate: f.audioSampleRate, url: f.url }));

    return res.status(200).json({ videoId, title: data.title, formats: { combined, videoOnly, audioOnly } });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
