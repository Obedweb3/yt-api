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

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, quality = "best" } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Missing 'q' param",
      example: "/api/search-download?q=Shape+of+You&quality=720",
    });
  }

  try {
    // Step 1: Search
    const searchRes = await axios.get(`https://${HOST}/search/`, {
      params: { q, hl: "en", gl: "US", type: "video" },
      headers: headers(),
    });

    const raw = searchRes.data?.contents || [];
    let topVideoId = null;
    let topMeta = {};

    for (const item of raw) {
      const video = item?.video || item?.videoRenderer || item?.compactVideoRenderer;
      if (!video) continue;
      const id = video.videoId || video.id;
      if (!id) continue;

      topVideoId = id;
      topMeta = {
        title:    video.title?.runs?.[0]?.text || video.title?.simpleText || (typeof video.title === "string" ? video.title : "Unknown"),
        channel:  video.author?.title || video.shortBylineText?.runs?.[0]?.text || "Unknown",
        duration: video.lengthText?.simpleText || null,
        views:    video.shortViewCountText?.simpleText || null,
        thumbnail: video.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
      break;
    }

    if (!topVideoId) {
      return res.status(404).json({ error: "No video results found for that query" });
    }

    // Step 2: Fetch streaming data
    const { data: info } = await axios.get(`https://${HOST}/video/info/`, {
      params: { id: topVideoId, hl: "en", gl: "US" },
      headers: headers(),
    });

    const sd = info?.streamingData;
    if (!sd) return res.status(404).json({ error: "Could not fetch streaming data" });

    // Best MP4
    const allMp4 = [
      ...(sd.formats || []),
      ...(sd.adaptiveFormats || []),
    ].filter(f => f.mimeType?.includes("video/mp4") && f.url);

    let mp4;
    if (quality === "best") {
      mp4 = allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    } else {
      const h = parseInt(quality);
      mp4 = allMp4.find(f => f.height === h) || allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    }

    // Best audio
    const audio = (sd.adaptiveFormats || [])
      .filter(f => f.mimeType?.startsWith("audio") && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    // All quality options
    const qualities = allMp4
      .filter(f => f.qualityLabel)
      .map(f => ({ itag: f.itag, quality: f.qualityLabel, height: f.height }))
      .filter((v, i, a) => a.findIndex(x => x.quality === v.quality) === i)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    return res.status(200).json({
      query: q,
      topResult: {
        videoId:  topVideoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${topVideoId}`,
        ...topMeta,
      },
      downloads: {
        mp4: mp4 ? {
          itag:        mp4.itag,
          quality:     mp4.qualityLabel,
          height:      mp4.height,
          mimeType:    mp4.mimeType,
          downloadUrl: mp4.url,
          streamUrl:   `/api/stream?url=${topVideoId}&itag=${mp4.itag}`,
        } : null,
        mp3: audio ? {
          itag:        audio.itag,
          mimeType:    audio.mimeType,
          bitrate:     audio.bitrate,
          downloadUrl: audio.url,
          streamUrl:   `/api/stream?url=${topVideoId}&itag=${audio.itag}`,
          note:        "M4A audio stream — pipe through ffmpeg to convert to .mp3",
        } : null,
      },
      availableQualities: qualities,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({
      error: "Search+download failed",
      details: err.response?.data || err.message,
    });
  }
};
