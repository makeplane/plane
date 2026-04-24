# Vercel

## CLI
```bash
npm i -g vercel
vercel login
vercel              # preview
vercel --prod       # production
```

## Config: vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Detection
- `vercel.json`, `.vercel/` directory
- Auto-detects Next.js, Vite, Remix frameworks

## Free Tier (Hobby)
- 100GB bandwidth/mo, 1M edge requests/mo
- Non-commercial use only
- 10s function timeout
- Commercial requires Pro ($20/mo)

## Rollback
```bash
vercel rollback [deployment-url]
```

## Best For
Frontend frameworks (Next.js first-class), serverless APIs, SPAs
