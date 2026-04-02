# Github Pages

## CLI
```bash
# Install GitHub CLI
winget install --id GitHub.cli  # Windows
brew install gh                  # macOS

# Deploy via gh-pages package
npm run build
npx gh-pages -d dist
```

## Config: .github/workflows/deploy-pages.yml
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Detection
- `gh-pages` branch
- `.github/workflows/` with `deploy-pages` or `pages` actions

## Free Tier
- Completely free for public repos
- 1GB repo size, 100GB bandwidth/mo, 10 builds/hr

## Rollback
Revert commit and push, or re-run previous workflow

## Best For
Static sites only — docs, portfolios, project pages. No server-side code.
