const { cors } = require("../lib");
module.exports = (req, res) => {
  cors(res);
  res.status(200).json({
    status: "ok",
    metadata: "YouTube Data API v3 (Google)",
    downloads: "YouTube Innertube (free, no key)",
  });
};
