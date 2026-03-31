const axios = require("axios");

const HOST = "youtube138.p.rapidapi.com";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function headers() {
  return {
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": HOST,
    "Content-Type": "application/json",
  };
}

function extractId(input) {
  const patterns = [
    /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing 'url' param. Example: /api/download-mp3?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const { data } = await axios.get(`https://${HOST}/video/info/`, {
      params: { id: videoId, hl: "en", gl: "US" },
      headers: headers(),
    });

    const sd = data?.streamingData;
    if (!sd) return res.status(404).json({ error: "No streaming data found" });

    const audioFormats = (sd.adaptiveFormats || [])
      .filter(f => f.mimeType?.startsWith("audio") && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (!audioFormats.length) return res.status(404).json({ error: "No audio format found" });

    const best = audioFormats[0];

    return res.status(200).json({
      videoId,
      title:       data.title,
      mime:        best.mimeType,
      itag:        best.itag,
      bitrate:     best.bitrate,
      sampleRate:  best.audioSampleRate,
      downloadUrl: best.url,
      streamUrl:   `/api/stream?url=${videoId}&itag=${best.itag}`,
      note:        "M4A audio stream. Convert to MP3: ffmpeg -i <url> -vn -b:a 192k out.mp3",
      allOptions:  audioFormats.map(f => ({ itag: f.itag, mime: f.mimeType, bitrate: f.bitrate })),
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: "Failed to get audio download",
      details: err.response?.data || err.message,
    });
  }
};
