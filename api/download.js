const { cors, extractId, get } = require("../lib");

// GET /api/download?url=VIDEO_ID&type=mp4&quality=720
// GET /api/download?url=VIDEO_ID&type=mp3
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, type = "mp4", quality } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/download?url=dQw4w9WgXcQ&type=mp4&quality=720" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await get("/video/details", { videoId });

    if (type === "mp3") {
      const audios = data?.audios;
      if (!audios?.length) return res.status(404).json({ error: "No audio formats found" });
      const best = audios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      return res.status(200).json({
        videoId,
        title: data.title,
        type: "audio",
        mime: best.mimeType,
        bitrate: best.bitrate,
        downloadUrl: best.url,
        allOptions: audios.map(a => ({ mime: a.mimeType, bitrate: a.bitrate, url: a.url })),
      });
    }

    // MP4
    const videos = data?.videos;
    if (!videos?.length) return res.status(404).json({ error: "No video formats found" });

    const mp4s = videos.filter(v => v.mimeType?.includes("mp4"));
    const chosen = quality
      ? (mp4s.find(v => String(v.height) === String(quality)) || mp4s.sort((a, b) => (b.height || 0) - (a.height || 0))[0])
      : mp4s.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    if (!chosen) return res.status(404).json({ error: "No MP4 format found for requested quality" });

    return res.status(200).json({
      videoId,
      title: data.title,
      type: "video",
      quality: chosen.qualityLabel || `${chosen.height}p`,
      mime: chosen.mimeType,
      width: chosen.width,
      height: chosen.height,
      downloadUrl: chosen.url,
      allOptions: mp4s.map(v => ({ quality: v.qualityLabel || `${v.height}p`, mime: v.mimeType, width: v.width, height: v.height, url: v.url })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
