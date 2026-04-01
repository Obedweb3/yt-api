const { cors } = require("../lib");
module.exports = (req, res) => {
  cors(res);
  res.status(200).json({ status: "ok", api: "youtube-media-downloader", version: "v2" });
};
