# Deployment Doc Template

After successful deploy, create `docs/deployment.md`:

```markdown
# Deployment

## Platform
[Platform name] — [URL to dashboard]

## Production URL
[https://your-app.example.com]

## Deploy Command
\`\`\`bash
[deploy command here]
\`\`\`

## Environment Variables
| Variable | Description | Required |
|---|---|---|
| NODE_ENV | Environment | Yes |
| DATABASE_URL | Database connection | Yes |

## Custom Domain
[Steps to configure custom domain, if applicable]

## Rollback
\`\`\`bash
[rollback command — e.g., vercel rollback, fly releases, etc.]
\`\`\`

## Troubleshooting
[Common issues and solutions]
```
