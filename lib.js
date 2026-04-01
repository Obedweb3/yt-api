const axios = require("axios");

// ─── CORS ───────────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── YouTube video ID extractor ──────────────────────────────────────────────
function extractId(input) {
  if (!input) return null;
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

// ─── YouTube Data API v3 (Google) — metadata, search, channel, playlist ─────
function ytKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY env variable not set. Add it in Vercel → Settings → Environment Variables.");
  return key;
}

async function ytGet(path, params = {}) {
  const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/${path}`, {
    params: { ...params, key: ytKey() },
  });
  return data;
}

// ─── Innertube (YouTube internal, no key) — download URLs ───────────────────
const INNERTUBE_CLIENT = { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "en", gl: "US" };

async function getPlayer(videoId) {
  const { data } = await axios.post(
    "https://www.youtube.com/youtubei/v1/player",
    {
      context: { client: INNERTUBE_CLIENT },
      videoId,
      playbackContext: { contentPlaybackContext: { signatureTimestamp: 19950 } },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": INNERTUBE_CLIENT.clientVersion,
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      },
    }
  );
  return data;
}

module.exports = { cors, extractId, ytGet, getPlayer };
