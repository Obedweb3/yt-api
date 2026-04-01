const axios = require("axios");

const HOST = "youtube-media-downloader.p.rapidapi.com";
const BASE = `https://${HOST}/v2`;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function headers() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY environment variable is not set.");
  return { "x-rapidapi-key": key, "x-rapidapi-host": HOST };
}

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

async function get(path, params = {}) {
  const { data } = await axios.get(`${BASE}${path}`, { params, headers: headers() });
  return data;
}

module.exports = { cors, extractId, get };
