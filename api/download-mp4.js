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

  const { url, quality = "best" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing 'url' param. Example: /api/download-mp4?url=dQw4w9WgXcQ&quality=720" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const { data } = await axios.get(`https://${HOST}/video/info/`, {
      params: { id: videoId, hl: "en", gl: "US" },
      headers: headers(),
    });

    const sd = data?.streamingData;
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
      chosen = all.find(f => f.height === h) || all.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
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
      streamUrl:   `/api/stream?url=${videoId}&itag=${chosen.itag}`,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: "Failed to get MP4 download",
      details: err.response?.data || err.message,
    });
  }
};
