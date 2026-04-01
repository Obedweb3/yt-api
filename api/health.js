module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    endpoints: {
      search: "/api/search?q=",
      info: "/api/info?url=",
      download: "/api/download?url=&type=mp4|mp3",
      channel: "/api/channel?id=",
      playlist: "/api/playlist?id=",
    },
    powered_by: {
      metadata: "YouTube Data API v3 (Google)",
      downloads: "YouTube Innertube (free, no key)",
    },
  });
};
