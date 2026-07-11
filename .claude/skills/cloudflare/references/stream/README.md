# Cloudflare Stream

Serverless live and on-demand video streaming platform with one API.

## Overview

Cloudflare Stream provides video upload, storage, encoding, and delivery without managing infrastructure. Runs on Cloudflare's global network.

### Key Features
- **On-demand video**: Upload, encode, store, deliver
- **Live streaming**: RTMPS/SRT ingestion with ABR
- **Direct creator uploads**: End users upload without API keys
- **Signed URLs**: Token-based access control
- **Analytics**: Server-side metrics via GraphQL
- **Webhooks**: Processing notifications
- **Captions**: Upload or AI-generate subtitles
- **Watermarks**: Apply branding to videos
- **Downloads**: Enable MP4 offline viewing

## Core Concepts

### Video Upload Methods
1. **API Upload (TUS protocol)**: Direct server upload
2. **Upload from URL**: Import from external source
3. **Direct Creator Uploads**: User-generated content (recommended)

### Playback Options
1. **Stream Player (iframe)**: Built-in, optimized player
2. **Custom Player (HLS/DASH)**: Video.js, HLS.js integration
3. **Thumbnails**: Static or animated previews

### Access Control
- **Public**: No restrictions
- **requireSignedURLs**: Token-based access
- **allowedOrigins**: Domain restrictions
- **Access Rules**: Geo/IP restrictions in tokens

### Live Streaming
- RTMPS/SRT ingest from OBS, FFmpeg
- Automatic recording to on-demand
- Simulcast to YouTube, Twitch, etc.
- WebRTC support for browser streaming

## Quick Start

**Upload video via API**
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/copy" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/video.mp4"}'
```

**Embed player**
```html
<iframe
  src="https://customer-<CODE>.cloudflarestream.com/<VIDEO_ID>/iframe"
  style="border: none;"
  height="720" width="1280"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

**Create live input**
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"recording": {"mode": "automatic"}}'
```

## Limits

- Max file size: 30 GB
- Max frame rate: 60 fps (recommended)
- Supported formats: MP4, MKV, MOV, AVI, FLV, MPEG-2 TS/PS, MXF, LXF, GXF, 3GP, WebM, MPG, QuickTime

## Pricing

- $5/1000 min stored
- $1/1000 min delivered

## Resources

- Dashboard: https://dash.cloudflare.com/?to=/:account/stream
- API Docs: https://developers.cloudflare.com/api/resources/stream/
- Stream Docs: https://developers.cloudflare.com/stream/

## Reading Order

| Order | File | Purpose | When to Use |
|-------|------|---------|-------------|
| 1 | [configuration.md](./configuration.md) | Setup SDKs, env vars, signing keys | Starting new project |
| 2 | [api.md](./api.md) | On-demand video APIs | Implementing uploads/playback |
| 3 | [api-live.md](./api-live.md) | Live streaming APIs | Building live streaming |
| 4 | [patterns.md](./patterns.md) | Full-stack flows, TUS, JWT signing | Implementing workflows |
| 5 | [gotchas.md](./gotchas.md) | Errors, limits, troubleshooting | Debugging issues |

## In This Reference

- [configuration.md](./configuration.md) - Setup, environment variables, wrangler config
- [api.md](./api.md) - On-demand video upload, playback, management APIs
- [api-live.md](./api-live.md) - Live streaming (RTMPS/SRT/WebRTC), simulcast
- [patterns.md](./patterns.md) - Full-stack flows, state management, best practices
- [gotchas.md](./gotchas.md) - Error codes, troubleshooting, limits

## See Also

- [workers](../workers/) - Deploy Stream APIs in Workers
- [pages](../pages/) - Integrate Stream with Pages
- [workers-ai](../workers-ai/) - AI-generate captions
