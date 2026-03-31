const { extractVideoId, fetchVideoInfo, setCors } = require("../_utils");

// Vercel serverless functions have a 10s (hobby) / 60s (pro) execution limit
// and cannot pipe large binary streams reliably.
// Best practice on Vercel: resolve the direct URL and issue a 302 redirect.
// The browser/client then downloads directly from Google's CDN — no timeout risk.

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { url, itag } = req.query;
  if (!url || !itag)
    return res.status(400).json({ error: "Missing 'url' or 'itag' query param" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or video ID" });

  try {
    const data = await fetchVideoInfo(videoId);
    const sd   = data?.streamingData;

    const all = [
      ...(sd?.formats          || []),
      ...(sd?.adaptiveFormats  || []),
    ];

    const format = all.find(f => String(f.itag) === String(itag));
    if (!format?.url)
      return res.status(404).json({ error: `No format found for itag ${itag}` });

    const title = (data.title || "video").replace(/[^a-z0-9\-_ ]/gi, "_");
    const ext   = format.mimeType?.startsWith("audio") ? "m4a" : "mp4";

    // Redirect to the direct Google CDN URL — client downloads it directly
    res.setHeader("Content-Disposition", `attachment; filename="${title}.${ext}"`);
    return res.redirect(302, format.url);
  } catch (err) {
    return res.status(500).json({
      error:   "Stream redirect failed",
      details: err.message,
    });
  }
};
