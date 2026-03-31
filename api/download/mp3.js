const { extractVideoId, fetchVideoInfo, setCors } = require("../_utils");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing 'url' query param" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data  = await fetchVideoInfo(videoId);
    const sd    = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const audioFormats = (sd.adaptiveFormats || [])
      .filter(f => f.mimeType?.startsWith("audio") && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (!audioFormats.length)
      return res.status(404).json({ error: "No audio format found" });

    const best = audioFormats[0];

    return res.status(200).json({
      videoId,
      title:           data.title,
      mime:            best.mimeType,
      itag:            best.itag,
      bitrate:         best.bitrate,
      audioSampleRate: best.audioSampleRate,
      downloadUrl:     best.url,
      note:            "M4A audio stream. Use ffmpeg to convert: ffmpeg -i <url> -vn -b:a 192k out.mp3",
      allOptions:      audioFormats.map(f => ({
        itag:    f.itag,
        mime:    f.mimeType,
        bitrate: f.bitrate,
        url:     f.url,
      })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error:   "Failed to get audio download",
      details: err.response?.data || err.message,
    });
  }
};
