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

  const { url, itag } = req.query;
  if (!url || !itag) return res.status(400).json({ error: "Missing 'url' or 'itag' param. Example: /api/stream?url=dQw4w9WgXcQ&itag=22" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const { data } = await axios.get(`https://${HOST}/video/info/`, {
      params: { id: videoId, hl: "en", gl: "US" },
      headers: headers(),
    });

    const all = [
      ...(data?.streamingData?.formats || []),
      ...(data?.streamingData?.adaptiveFormats || []),
    ];

    const format = all.find(f => String(f.itag) === String(itag));
    if (!format?.url) return res.status(404).json({ error: `No format found for itag ${itag}` });

    const title = (data.title || "video").replace(/[^a-z0-9\-_ ]/gi, "_");
    const ext   = format.mimeType?.startsWith("audio") ? "m4a" : "mp4";

    res.setHeader("Content-Disposition", `attachment; filename="${title}.${ext}"`);
    return res.redirect(302, format.url);
  } catch (err) {
    return res.status(500).json({
      error: "Stream redirect failed",
      details: err.message,
    });
  }
};
