module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY
        ? "✅ set"
        : "❌ MISSING — go to Vercel → Project → Settings → Environment Variables → add RAPIDAPI_KEY",
    },
  });
};
