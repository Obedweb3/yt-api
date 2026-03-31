const axios = require("axios");
const { cors, headers, extractId, fetchInfo, HOST } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, quality = "best" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing ?q=  Example: /api/search-download?q=Shape+of+You&quality=720" });

  try {
    const searchRes = await axios.get(`https://${HOST}/search/`, {
      params: { q, hl: "en", gl: "US", type: "video" },
      headers: headers(),
    });

    const raw = searchRes.data?.contents || [];
    let topVideoId = null, topMeta = {};

    for (const item of raw) {
      const video = item?.video || item?.videoRenderer || item?.compactVideoRenderer;
      if (!video) continue;
      const id = video.videoId || video.id;
      if (!id) continue;
      topVideoId = id;
      topMeta = {
        title:     video.title?.runs?.[0]?.text || video.title?.simpleText || (typeof video.title === "string" ? video.title : "Unknown"),
        channel:   video.author?.title || video.shortBylineText?.runs?.[0]?.text || "Unknown",
        duration:  video.lengthText?.simpleText || null,
        views:     video.shortViewCountText?.simpleText || null,
        thumbnail: video.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
      break;
    }

    if (!topVideoId) return res.status(404).json({ error: "No video results found" });

    const info = await fetchInfo(topVideoId);
    const sd = info?.streamingData;
    if (!sd) return res.status(404).json({ error: "Could not fetch streaming data" });

    const allMp4 = [...(sd.formats || []), ...(sd.adaptiveFormats || [])].filter(f => f.mimeType?.includes("video/mp4") && f.url);
    let mp4 = quality === "best"
      ? allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0]
      : (allMp4.find(f => f.height === parseInt(quality)) || allMp4.sort((a, b) => (b.height || 0) - (a.height || 0))[0]);

    const audio = (sd.adaptiveFormats || []).filter(f => f.mimeType?.startsWith("audio") && f.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    const qualities = allMp4.filter(f => f.qualityLabel).map(f => ({ itag: f.itag, quality: f.qualityLabel, height: f.height })).filter((v, i, a) => a.findIndex(x => x.quality === v.quality) === i).sort((a, b) => (b.height || 0) - (a.height || 0));

    return res.status(200).json({
      query: q,
      topResult: { videoId: topVideoId, youtubeUrl: `https://www.youtube.com/watch?v=${topVideoId}`, ...topMeta },
      downloads: {
        mp4: mp4 ? { itag: mp4.itag, quality: mp4.qualityLabel, height: mp4.height, downloadUrl: mp4.url, streamUrl: `/api/stream?url=${topVideoId}&itag=${mp4.itag}` } : null,
        mp3: audio ? { itag: audio.itag, mimeType: audio.mimeType, bitrate: audio.bitrate, downloadUrl: audio.url, streamUrl: `/api/stream?url=${topVideoId}&itag=${audio.itag}` } : null,
      },
      availableQualities: qualities,
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
};
