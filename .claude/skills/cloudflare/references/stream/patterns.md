# Stream Patterns

Common workflows, full-stack flows, and best practices.

## React Stream Player

`npm install @cloudflare/stream-react`

```tsx
import { Stream } from '@cloudflare/stream-react';

export function VideoPlayer({ videoId, token }: { videoId: string; token?: string }) {
  return <Stream controls src={token ? `${videoId}?token=${token}` : videoId} responsive />;
}
```

## Full-Stack Upload Flow

**Backend API (Workers/Pages)**
```typescript
import Cloudflare from 'cloudflare';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { videoName } = await request.json();
    const client = new Cloudflare({ apiToken: env.CF_API_TOKEN });
    const { uploadURL, uid } = await client.stream.directUpload.create({
      account_id: env.CF_ACCOUNT_ID,
      maxDurationSeconds: 3600,
      requireSignedURLs: true,
      meta: { name: videoName }
    });
    return Response.json({ uploadURL, uid });
  }
};
```

**Frontend component**
```tsx
import { useState } from 'react';

export function VideoUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  async function handleUpload(file: File) {
    setUploading(true);
    const { uploadURL, uid } = await fetch('/api/upload-url', {
      method: 'POST',
      body: JSON.stringify({ videoName: file.name })
    }).then(r => r.json());
    
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => setProgress((e.loaded / e.total) * 100);
    xhr.onload = () => { setUploading(false); window.location.href = `/videos/${uid}`; };
    xhr.open('POST', uploadURL);
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  }
  
  return (
    <div>
      <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
      {uploading && <progress value={progress} max={100} />}
    </div>
  );
}
```

## TUS Resumable Upload

For large files (>500MB). `npm install tus-js-client`

```typescript
import * as tus from 'tus-js-client';

async function uploadWithTUS(file: File, uploadURL: string, onProgress?: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: uploadURL,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 50 * 1024 * 1024,
      metadata: { filename: file.name, filetype: file.type },
      onError: reject,
      onProgress: (up, total) => onProgress?.((up / total) * 100),
      onSuccess: () => resolve(upload.url?.split('/').pop() || '')
    });
    upload.start();
  });
}
```

## Video State Polling

```typescript
async function waitForVideoReady(client: Cloudflare, accountId: string, videoId: string) {
  for (let i = 0; i < 60; i++) {
    const video = await client.stream.videos.get(videoId, { account_id: accountId });
    if (video.readyToStream || video.status.state === 'error') return video;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Video processing timeout');
}
```

## Webhook Handler

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const signature = request.headers.get('Webhook-Signature');
    const body = await request.text();
    if (!signature || !await verifyWebhook(signature, body, env.WEBHOOK_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }
    const payload = JSON.parse(body);
    if (payload.readyToStream) console.log(`Video ${payload.uid} ready`);
    return new Response('OK');
  }
};

async function verifyWebhook(sig: string, body: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sig.split(',').map(p => p.split('=')));
  const timestamp = parseInt(parts.time || '0', 10);
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const computed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
  const hex = Array.from(new Uint8Array(computed), b => b.toString(16).padStart(2, '0')).join('');
  return hex === parts.sig1;
}
```

## Self-Sign JWT (High Volume Tokens)

For >1k tokens/day. Prerequisites: Create signing key (see configuration.md).

```typescript
async function selfSignToken(keyId: string, jwkBase64: string, videoId: string, expiresIn = 3600) {
  const key = await crypto.subtle.importKey(
    'jwk', JSON.parse(atob(jwkBase64)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', kid: keyId })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({ sub: videoId, kid: keyId, exp: now + expiresIn, nbf: now }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const message = `${header}.${payload}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(message));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${message}.${b64Sig}`;
}

// With access rules (geo-restriction)
const payloadWithRules = {
  sub: videoId, kid: keyId, exp: now + 3600, nbf: now,
  accessRules: [{ type: 'ip.geoip.country', action: 'allow', country: ['US'] }]
};
```

## Best Practices

- **Use Direct Creator Uploads** - Avoid proxying through servers
- **Enable requireSignedURLs** - Control private content access
- **Self-sign tokens at scale** - Use signing keys for >1k/day
- **Set allowedOrigins** - Prevent hotlinking
- **Use webhooks over polling** - Efficient status updates
- **Set maxDurationSeconds** - Prevent abuse
- **Enable live recordings** - Auto VOD after stream

## In This Reference

- [README.md](./README.md) - Overview and quick start
- [configuration.md](./configuration.md) - Setup and config
- [api.md](./api.md) - On-demand video APIs
- [api-live.md](./api-live.md) - Live streaming APIs
- [gotchas.md](./gotchas.md) - Error codes, troubleshooting

## See Also

- [workers](../workers/) - Deploy Stream APIs in Workers
- [pages](../pages/) - Integrate Stream with Pages
