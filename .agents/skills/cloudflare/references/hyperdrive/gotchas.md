# Gotchas

See [README.md](./README.md), [configuration.md](./configuration.md), [api.md](./api.md), [patterns.md](./patterns.md).

## Common Errors

### "Too many open connections" / "Connection limit exceeded"

**Cause:** Workers have a hard limit of **6 concurrent connections per invocation**  
**Solution:** Set `max: 5` in driver config, reuse connections, ensure proper cleanup with `client.end()` or `ctx.waitUntil(conn.end())`

### "Failed to acquire a connection (Pool exhausted)"

**Cause:** All connections in pool are in use, often due to long-running transactions  
**Solution:** Reduce transaction duration, avoid queries >60s, don't hold connections during external calls, or upgrade to paid plan for more connections

### "connection_refused"

**Cause:** Database refusing connections due to firewall, connection limits, or service down  
**Solution:** Check firewall allows Cloudflare IPs, verify DB listening on port, confirm service running, and validate credentials

### "Query timeout (deadline exceeded)"

**Cause:** Query execution exceeding 60s timeout limit  
**Solution:** Optimize with indexes, reduce dataset with LIMIT, break into smaller queries, or use async processing

### "password authentication failed"

**Cause:** Invalid credentials in Hyperdrive configuration  
**Solution:** Check username and password in Hyperdrive config match database credentials

### "SSL/TLS connection error"

**Cause:** SSL/TLS configuration mismatch between Hyperdrive and database  
**Solution:** Add `sslmode=require` (Postgres) or `sslMode=REQUIRED` (MySQL), upload CA cert if self-signed, verify DB has SSL enabled, and check cert expiry

### "Queries not being cached"

**Cause:** Query is mutating (INSERT/UPDATE/DELETE), contains volatile functions (NOW(), RANDOM()), or caching disabled  
**Solution:** Verify query is non-mutating SELECT, avoid volatile functions, confirm caching enabled, use `wrangler dev --remote` to test, and set `prepare=true` for postgres.js

### "Slow multi-query Workers despite Hyperdrive"

**Cause:** Worker executing at edge, each query round-trips to DB region  
**Solution:** Enable Smart Placement (`"placement": {"mode": "smart"}` in wrangler.jsonc) to execute Worker near DB. See [patterns.md](./patterns.md) Multi-Query pattern.

### "Local database connection failed"

**Cause:** `localConnectionString` incorrect or database not running  
**Solution:** Verify `localConnectionString` correct, check DB running, confirm env var name matches binding, and test with psql/mysql client

### "Environment variable not working"

**Cause:** Environment variable format incorrect or not exported  
**Solution:** Use format `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING>`, ensure binding matches wrangler.jsonc, export variable in shell, and restart wrangler dev

## Limits

| Limit | Free | Paid | Notes |
|-------|------|------|-------|
| Max configs | 10 | 25 | Hyperdrive configurations per account |
| Worker connections | 6 | 6 | Max concurrent connections per Worker invocation |
| Username/DB name | 63 bytes | 63 bytes | Maximum length |
| Connection timeout | 15s | 15s | Time to establish connection |
| Idle timeout | 10 min | 10 min | Connection idle timeout |
| Max origin connections | ~20 | ~100 | Connections to origin database |
| Query duration max | 60s | 60s | Queries >60s terminated |
| Cached response max | 50 MB | 50 MB | Responses >50MB returned but not cached |

## Resources

- [Docs](https://developers.cloudflare.com/hyperdrive/)
- [Getting Started](https://developers.cloudflare.com/hyperdrive/get-started/)
- [Wrangler Reference](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/)
- [Supported DBs](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- [Discord #hyperdrive](https://discord.cloudflare.com)
- [Limit Increase Form](https://forms.gle/ukpeZVLWLnKeixDu7)
