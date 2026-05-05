# Heroku

## CLI
```bash
npm install -g heroku
heroku login
heroku create my-app
git push heroku main
```

## Config: Procfile
```
web: npm start
```

## Detection
- `Procfile`, `app.json`, buildpack detection

## Free Tier
- None (removed Nov 2022)
- Eco dynos: $5/mo
- In "sustaining engineering mode" since Feb 2026 — no new features

## Rollback
```bash
heroku releases
heroku rollback v123
```

## Best For
Legacy workloads only. Not recommended for new projects — migrate to Railway/Render/Fly.
