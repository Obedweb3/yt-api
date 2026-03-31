# 🎬 YT Downloader API — Vercel Serverless

YouTube download API built with Vercel Serverless Functions + YouTube138 on RapidAPI.

---

## 🚀 Deploy to Vercel

### Option A — Vercel CLI (recommended)
```bash
npm i -g vercel
vercel          # follow prompts
```

### Option B — GitHub
1. Push this folder to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new) → Import repo
3. Add env variable (see below)
4. Click **Deploy**

---

## 🔑 Environment Variable

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `RAPIDAPI_KEY` | `cfea52bd4cmsh28d929441fe9ab3p1426b2jsnd66089b43ae1` |

---

## 📁 Project Structure

```
/
├── vercel.json          ← routing config
├── package.json
└── api/
    ├── _utils.js        ← shared helpers (not a route)
    ├── info.js          ← GET /api/info
    ├── formats.js       ← GET /api/formats
    ├── health.js        ← GET /health
    └── download/
        ├── mp4.js       ← GET /api/download/mp4
        ├── mp3.js       ← GET /api/download/mp3
        └── stream.js    ← GET /api/download/stream
```

---

## 📡 Endpoints

### `GET /api/info?url=<yt_url>`
Video metadata — title, thumbnail, channel, duration.

```bash
curl "https://your-app.vercel.app/api/info?url=https://youtu.be/dQw4w9WgXcQ"
```

---

### `GET /api/formats?url=<yt_url>`
All available formats grouped by type.

```bash
curl "https://your-app.vercel.app/api/formats?url=dQw4w9WgXcQ"
```

Response shape:
```json
{
  "formats": {
    "combined":  [...],   // MP4 video+audio (360p / 720p)
    "videoOnly": [...],   // MP4 video only (1080p+)
    "audioOnly": [...]    // M4A audio only
  }
}
```

---

### `GET /api/download/mp4?url=<yt_url>&quality=<best|1080|720|480|360>`
Returns a direct MP4 URL.

```bash
curl "https://your-app.vercel.app/api/download/mp4?url=dQw4w9WgXcQ&quality=720"
```

---

### `GET /api/download/mp3?url=<yt_url>`
Returns the best audio stream URL (M4A).

```bash
curl "https://your-app.vercel.app/api/download/mp3?url=dQw4w9WgXcQ"
```

> Convert to MP3: `ffmpeg -i "<downloadUrl>" -vn -b:a 192k out.mp3`

---

### `GET /api/download/stream?url=<yt_url>&itag=<itag>`
Redirects (302) to the direct Google CDN stream — triggers browser download.

```bash
# Paste directly in browser or use as <a href="...">
https://your-app.vercel.app/api/download/stream?url=dQw4w9WgXcQ&itag=22
```

> Uses 302 redirect instead of proxying because Vercel has a 10s (Hobby) / 60s (Pro) function timeout — redirecting to Google's CDN means the client downloads directly with no timeout risk.

---

## ⚙️ Notes

- Streaming URLs from YouTube **expire** (~6 hours). Always fetch fresh per request.
- 1080p+ video has no audio — you need to merge `videoOnly` + `audioOnly` via ffmpeg.
- Vercel **Hobby** plan: 10s function timeout. Upgrade to **Pro** for 60s if needed.
