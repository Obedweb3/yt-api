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
  if (!url) return res.status(400).json({ error: "Missing 'url' param. Example: /api/info?url=dQw4w9WgXcQ" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const { data } = await axios.get(`https://${HOST}/video/info/`, {
      params: { id: videoId, hl: "en", gl: "US" },
      headers: headers(),
    });

    return res.status(200).json({
      videoId,
      title:       data.title,
      duration:    data.lengthSeconds,
      thumbnail:   data.thumbnail?.thumbnails?.at(-1)?.url,
      channel:     data.author?.title,
      channelId:   data.author?.channelId,
      viewCount:   data.viewCount,
      publishDate: data.publishDate,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: "Failed to fetch video info",
      details: err.response?.data || err.message,
    });
  }
};
