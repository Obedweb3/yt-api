const axios = require("axios");

const HOST = "youtube138.p.rapidapi.com";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function headers() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY environment variable is not set. Add it in Vercel → Settings → Environment Variables.");
  return {
    "x-rapidapi-key": key,
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

async function fetchInfo(videoId) {
  const { data } = await axios.get(`https://${HOST}/video/info/`, {
    params: { id: videoId, hl: "en", gl: "US" },
    headers: headers(),
  });
  return data;
}

module.exports = { cors, headers, extractId, fetchInfo, HOST };
