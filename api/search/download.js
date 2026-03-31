const axios = require("axios");
const { setCors, fetchVideoInfo } = require("../_utils");

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

// Search for song by name, pick top result, return full download info in one call
module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { q, quality = "best" } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Missing 'q' query param",
      example: "/api/search/download?q=Blinding+Lights&quality=720",
    });
  }

  try {
    // Step 1: Search YouTube
    const searchRes = await axios.get(`${BASE_URL}/search/`, {
      params: { q, hl: "en", gl: "US", type: "video" },
      headers: rapidHeaders(),
    });

    const raw = searchRes.data?.contents || [];

    // Find first real video result
    let topVideoId = null;
    let topMeta    = {};

    for (const item of raw) {
      const video = item?.video || item?.videoRenderer || item?.compactVideoRenderer;
      if (!video) continue;
      const id = video.videoId || video.id;
      if (!id) continue;

      topVideoId = id;
      topMeta = {
        title:   video.title?.runs?.[0]?.text || video.title?.simpleText || video.title || "Unknown",
        channel: video.author?.title || video.shortBylineText?.runs?.[0]?.text || "Unknown",
        duration: video.lengthText?.simpleText || null,
        views:    video.shortViewCountText?.simpleText || null,
        thumbnail: video.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
      break;
    }

    if (!topVideoId) {
      return res.status(404).json({ error: "No video results found for that query" });
    }

    // Step 2: Fetch full streaming data for the top result
    const info = await fetchVideoInfo(topVideoId);
    const sd   = info?.streamingData;

    if (!sd) {
      return res.status(404).json({ error: "Could not fetch streaming data for top result" });
    }

    // Best MP4 (video+audio combined)
    const allMp4 = [
      ...(sd.formats || []),
      ...(sd.adaptiveFormats || []),
    ].filter(f => f.mimeType?.includes("video/mp4") && f.url);

    let mp4Format;
    if (quality === "best") {
      mp4Format = allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    } else {
      const h = parseInt(quality);
      mp4Format = allMp4.find(f => f.height === h)
               || allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    }

    // Best audio (for MP3)
    const bestAudio = (sd.adaptiveFormats || [])
      .filter(f => f.mimeType?.startsWith("audio") && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    // All available MP4 qualities
    const availableQualities = allMp4
      .filter(f => f.qualityLabel)
      .map(f => ({ itag: f.itag, quality: f.qualityLabel, height: f.height }))
      .filter((v, i, a) => a.findIndex(x => x.quality === v.quality) === i)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    return res.status(200).json({
      query: q,
      topResult: {
        videoId:   topVideoId,
        url:       `https://www.youtube.com/watch?v=${topVideoId}`,
        ...topMeta,
      },
      downloads: {
        mp4: mp4Format ? {
          itag:        mp4Format.itag,
          quality:     mp4Format.qualityLabel,
          height:      mp4Format.height,
          mimeType:    mp4Format.mimeType,
          downloadUrl: mp4Format.url,
          streamUrl:   `/api/download/stream?url=${topVideoId}&itag=${mp4Format.itag}`,
        } : null,
        mp3: bestAudio ? {
          itag:        bestAudio.itag,
          mimeType:    bestAudio.mimeType,
          bitrate:     bestAudio.bitrate,
          downloadUrl: bestAudio.url,
          streamUrl:   `/api/download/stream?url=${topVideoId}&itag=${bestAudio.itag}`,
          note:        "M4A stream — use ffmpeg to convert to MP3",
        } : null,
      },
      availableQualities,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error:   "Search+download failed",
      details: err.response?.data || err.message,
    });
  }
};
