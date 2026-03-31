const { cors, extractId, fetchInfo } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Example: /api/download-mp3?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchInfo(videoId);
    const sd = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const audioFormats = (sd.adaptiveFormats || []).filter(f => f.mimeType?.startsWith("audio") && f.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (!audioFormats.length) return res.status(404).json({ error: "No audio format found" });

    const best = audioFormats[0];
    return res.status(200).json({
      videoId, title: data.title, mime: best.mimeType, itag: best.itag,
      bitrate: best.bitrate, sampleRate: best.audioSampleRate,
      downloadUrl: best.url, streamUrl: `/api/stream?url=${videoId}&itag=${best.itag}`,
      note: "M4A stream. Convert: ffmpeg -i <url> -vn -b:a 192k out.mp3",
      allOptions: audioFormats.map(f => ({ itag: f.itag, mime: f.mimeType, bitrate: f.bitrate })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
