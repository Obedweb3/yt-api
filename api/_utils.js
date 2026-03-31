const axios = require("axios");

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "youtube138.p.rapidapi.com";
const BASE_URL      = `https://${RAPIDAPI_HOST}`;

function rapidHeaders() {
  return {
    "x-rapidapi-key":  RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type":    "application/json",
  };
}

function extractVideoId(input) {
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

async function fetchVideoInfo(videoId) {
  const res = await axios.get(`${BASE_URL}/video/info/`, {
    params:  { id: videoId, hl: "en", gl: "US" },
    headers: rapidHeaders(),
  });
  return res.data;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = { extractVideoId, fetchVideoInfo, setCors };
