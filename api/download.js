const { cors, extractId } = require("../lib");
const axios = require("axios");

async function getPlayerAndroid(videoId) {
  const { data } = await axios.post(
    "https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM394",
    {
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "19.09.37",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
          utcOffsetMinutes: 0,
        },
      },
      videoId,
      params: "2AMB",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
        "X-YouTube-Client-Name": "3",
        "X-YouTube-Client-Version": "19.09.37",
      },
    }
  );
  return data;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, type = "mp4", quality } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=  Add &type=mp4|mp3 and optionally &quality=720" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await getPlayerAndroid(videoId);

    if (data.playabilityStatus?.status === "ERROR") {
      return res.status(404).json({ error: data.playabilityStatus.reason || "Video not available" });
    }

    const sd = data.streamingData || {};
    const all = [
      ...(sd.formats || []),
      ...(sd.adaptiveFormats || []),
    ].filter(f => f.url);

    if (!all.length) {
      return res.status(404).json({
        error: "No stream URLs found — video may be age-restricted or unavailable",
        playabilityStatus: data.playabilityStatus?.status,
      });
    }

    if (type === "mp3") {
      const audios = all
        .filter(f => f.mimeType?.startsWith("audio"))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      if (!audios.length) return res.status(404).json({ error: "No audio formats found" });
      const best = audios[0];
      return res.status(200).json({
        videoId,
        title: data.videoDetails?.title,
        type: "audio",
        mime: best.mimeType,
        bitrate: best.bitrate,
        url: best.url,
        note: "M4A stream — use ffmpeg to convert to mp3 if needed",
        allOptions: audios.map(a => ({
          itag: a.itag,
          mime: a.mimeType,
          bitrate: a.bitrate,
        })),
      });
    }

    // MP4
    const mp4s = all
      .filter(f => f.mimeType?.includes("video/mp4"))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    if (!mp4s.length) return res.status(404).json({ error: "No MP4 formats found" });

    const chosen = quality
      ? (mp4s.find(f => String(f.height) === String(quality)) || mp4s[0])
      : mp4s[0];

    return res.status(200).json({
      videoId,
      title: data.videoDetails?.title,
      type: "video",
      quality: chosen.qualityLabel || `${chosen.height}p`,
      mime: chosen.mimeType,
      width: chosen.width,
      height: chosen.height,
      url: chosen.url,
      allOptions: mp4s.map(v => ({
        itag: v.itag,
        quality: v.qualityLabel || `${v.height}p`,
        mime: v.mimeType,
        width: v.width,
        height: v.height,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
};
