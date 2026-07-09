# Wrangler Common Issues

## Common Errors

### "Binding ID vs name mismatch"

**Cause:** Confusion between binding name (code) and resource ID
**Solution:** Bindings use `binding` (code name) and `id`/`database_id`/`bucket_name` (resource ID). Preview bindings need separate IDs: `preview_id`, `preview_database_id`

### "Environment not inheriting config"

**Cause:** Non-inheritable keys not redefined per environment
**Solution:** Non-inheritable keys (bindings, vars) must be redefined per environment. Inheritable keys (routes, compatibility_date) can be overridden

### "Local dev behavior differs from production"

**Cause:** Using local simulation instead of remote execution
**Solution:** Choose appropriate remote mode:
- `wrangler dev` (default): Local simulation, fast, limited accuracy
- `wrangler dev --remote`: Full remote execution, production-accurate, slower
- Use `remote: "minimal"` in tests for fast tests with real remote bindings

### "startWorker doesn't match production"

**Cause:** Using local mode when remote resources needed
**Solution:** Use `remote` option:
```typescript
const worker = await startWorker({ 
  config: "wrangler.jsonc",
  remote: true  // or "minimal" for faster tests
});
```

### "Unexpected runtime changes"

**Cause:** Missing compatibility_date
**Solution:** Always set `compatibility_date`:
```jsonc
{ "compatibility_date": "2025-01-01" }
```

### "Durable Object binding not working"

**Cause:** Missing script_name for external DOs
**Solution:** Always specify `script_name` for external Durable Objects:
```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "MY_DO", "class_name": "MyDO", "script_name": "my-worker" }
    ]
  }
}
```

For local DOs in same Worker, `script_name` is optional.

### "Auto-provisioned resources not appearing"

**Cause:** IDs written back to config on first deploy, but config not reloaded
**Solution:** After first deploy with auto-provisioning, config file is updated with IDs. Commit the updated config. On subsequent deploys, existing resources are reused.

### "Secrets not available in local dev"

**Cause:** Secrets set with `wrangler secret put` only work in deployed Workers
**Solution:** For local dev, use `.dev.vars`

### "Node.js compatibility error"

**Cause:** Missing Node.js compatibility flag
**Solution:** Some bindings (Hyperdrive with `pg`) require:
```jsonc
{ "compatibility_flags": ["nodejs_compat"] }
```

### "Workers Assets 404 errors"

**Cause:** Asset path mismatch or incorrect `html_handling`
**Solution:** 
- Check `assets.directory` points to correct build output
- Set `html_handling: "auto-trailing-slash"` for SPAs
- Use `not_found_handling: "single-page-application"` to serve index.html for 404s
```jsonc
{
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

### "Placement not reducing latency"

**Cause:** Misunderstanding of Smart Placement
**Solution:** Smart Placement only helps when Worker accesses D1 or Durable Objects. It doesn't affect KV, R2, or external API latency.
```jsonc
{ "placement": { "mode": "smart" } }  // Only beneficial with D1/DOs
```

### "unstable_startWorker not found"

**Cause:** Using outdated API
**Solution:** Use stable `startWorker` instead:
```typescript
import { startWorker } from "wrangler";  // Not unstable_startWorker
```

### "outboundService not mocking fetch"

**Cause:** Mock function not returning Response
**Solution:** Always return Response, use `fetch(req)` for passthrough:
```typescript
const worker = await startWorker({
  outboundService: (req) => {
    if (shouldMock(req)) {
      return new Response("mocked");
    }
    return fetch(req);  // Required for non-mocked requests
  }
});
```

## Limits

| Resource/Limit | Value | Notes |
|----------------|-------|-------|
| Bindings per Worker | 64 | Total across all types |
| Environments | Unlimited | Named envs in config |
| Config file size | ~1MB | Keep reasonable |
| Workers Assets size | 25 MB | Per deployment |
| Workers Assets files | 20,000 | Max number of files |
| Script size (compressed) | 1 MB | Free, 10 MB paid |
| CPU time | 10ms | Free, 30s default (5min max) paid |
| Subrequest limit | 50 | Free, 10,000 paid |

## Troubleshooting

### Authentication Issues
```bash
wrangler logout
wrangler login
wrangler whoami
```

### Configuration Errors
```bash
wrangler check startup  # Profile Worker startup time and detect scripts exceeding the startup time limit
```
Use wrangler.jsonc with `$schema` for validation.

### Binding Not Available
- Check binding exists in config
- For environments, ensure binding defined for that env
- Local dev: some bindings need `--remote`

### Deployment Failures
```bash
wrangler tail              # Check logs
wrangler deploy --dry-run  # Validate
wrangler whoami            # Check account limits
```

### Local Development Issues
```bash
rm -rf .wrangler/state     # Clear local state
wrangler dev --remote      # Use remote bindings
wrangler dev --persist-to ./local-state  # Custom persist location
wrangler dev --inspector-port 9229  # Enable debugging
```

### Testing Issues
```bash
# If tests hang, ensure dispose() is called
worker.dispose()  // Always cleanup

# If bindings don't work in tests
const worker = await startWorker({ 
  config: "wrangler.jsonc",
  remote: "minimal"  // Use remote bindings
});
```

## Resources

- Docs: https://developers.cloudflare.com/workers/wrangler/
- Config: https://developers.cloudflare.com/workers/wrangler/configuration/
- Commands: https://developers.cloudflare.com/workers/wrangler/commands/
- Examples: https://github.com/cloudflare/workers-sdk/tree/main/templates
- Discord: https://discord.gg/cloudflaredev

## See Also

- [README.md](./README.md) - Commands
- [configuration.md](./configuration.md) - Config
- [api.md](./api.md) - Programmatic API
- [patterns.md](./patterns.md) - Workflows
