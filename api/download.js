const { cors, extractId, get } = require("../lib");
module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const { url, type = "mp4", quality } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Add &type=mp4|mp3 and optionally &quality=720" });
  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });
  try {
    const data = await get("/video/details", { videoId, urlAccess: "normal", lang: "en-US" });
    if (type === "mp3") {
      const audios = data?.audios;
      if (!audios?.length) return res.status(404).json({ error: "No audio formats found" });
      const best = audios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      return res.status(200).json({
        videoId, title: data.title, type: "audio",
        mime: best.mimeType, bitrate: best.bitrate, url: best.url,
        allOptions: audios.map(a => ({ mime: a.mimeType, bitrate: a.bitrate, url: a.url })),
      });
    }
    const videos = data?.videos;
    if (!videos?.length) return res.status(404).json({ error: "No video formats found" });
    const mp4s = videos.filter(v => v.mimeType?.includes("mp4"));
    const chosen = quality
      ? (mp4s.find(v => String(v.height) === String(quality)) || mp4s.sort((a, b) => (b.height || 0) - (a.height || 0))[0])
      : mp4s.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    if (!chosen) return res.status(404).json({ error: "No MP4 format found" });
    return res.status(200).json({
      videoId, title: data.title, type: "video",
      quality: chosen.qualityLabel || `${chosen.height}p`,
      mime: chosen.mimeType, width: chosen.width, height: chosen.height, url: chosen.url,
      allOptions: mp4s.map(v => ({ quality: v.qualityLabel || `${v.height}p`, mime: v.mimeType, width: v.width, height: v.height, url: v.url })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
