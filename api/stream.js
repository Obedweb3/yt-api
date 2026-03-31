const { cors, extractId, fetchInfo } = require("../lib");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, itag } = req.query;
  if (!url || !itag) return res.status(400).json({ error: "Missing ?url= or ?itag=  Example: /api/stream?url=dQw4w9WgXcQ&itag=22" });

  const videoId = extractId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchInfo(videoId);
    const all = [...(data?.streamingData?.formats || []), ...(data?.streamingData?.adaptiveFormats || [])];
    const format = all.find(f => String(f.itag) === String(itag));
    if (!format?.url) return res.status(404).json({ error: `No format found for itag ${itag}` });

    const title = (data.title || "video").replace(/[^a-z0-9\-_ ]/gi, "_");
    const ext = format.mimeType?.startsWith("audio") ? "m4a" : "mp4";
    res.setHeader("Content-Disposition", `attachment; filename="${title}.${ext}"`);
    return res.redirect(302, format.url);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
