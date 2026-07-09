# Gotchas & Debugging

## Common Errors

### "Step Timeout"

**Cause:** Step execution exceeding the default or configured timeout  
**Solution:** Set custom timeout with `step.do('long operation', {timeout: '30 minutes'}, async () => {...})` or increase CPU limit via `limits.cpu_ms` in wrangler.jsonc

### "waitForEvent Timeout"

**Cause:** Event not received within timeout period (check docs for default/max)  
**Solution:** Wrap in try-catch to handle timeout gracefully and proceed with default behavior

### "Non-Deterministic Step Names"

**Cause:** Using dynamic values like `Date.now()` in step names causes replay issues  
**Solution:** Use deterministic values like `event.instanceId` for step names

### "State Lost in Variables"

**Cause:** Using module-level or local variables to store state which is lost on hibernation  
**Solution:** Return values from `step.do()` which are automatically persisted: `const total = await step.do('step 1', async () => 10)`

### "Non-Deterministic Conditionals"

**Cause:** Using non-deterministic logic (like `Date.now()`) outside steps in conditionals  
**Solution:** Move non-deterministic operations inside steps: `const isLate = await step.do('check', async () => Date.now() > deadline)`

### "Large Step Returns Exceeding Limit"

**Cause:** Returning data exceeding the per-step return size limit  
**Solution:** Store large data in R2 and return only reference: `{ key: 'r2-object-key' }`. Alternatively, return a `ReadableStream<Uint8Array>` for large binary output

### "Step Exceeded CPU Limit But Ran for a Short Time"

**Cause:** Confusion between CPU time (active compute) and wall-clock time (includes I/O waits)  
**Solution:** Network requests, database queries, and sleeps don't count toward CPU. The CPU limit refers to active processing time only

### "Idempotency Violation"

**Cause:** Step operations not idempotent, causing duplicate charges or actions on retry  
**Solution:** Check if operation already completed before executing (e.g., check if customer already charged)

### "Instance ID Collision"

**Cause:** Reusing instance IDs causing conflicts  
**Solution:** Use unique IDs with timestamp: `await env.MY_WORKFLOW.create({ id: \`${userId}-${Date.now()}\`, params: {} })`

### "Instance Data Disappeared After Completion"

**Cause:** Completed/errored instances are automatically deleted after the retention period (differs by plan)  
**Solution:** Export critical data to KV/R2/D1 before workflow completes

### "Missing await on step.do"

**Cause:** Forgetting to await step.do() causing fire-and-forget behavior  
**Solution:** Always await step operations: `await step.do('task', ...)`

### "Provided event type is invalid"

**Cause:** Using unsupported characters in `waitForEvent` type (e.g. `.`)  
**Solution:** Type only supports letters, digits, `-`, and `_`. Pattern: `^[a-zA-Z0-9_][a-zA-Z0-9-_]*$`

## Limits & Pricing

Limits and pricing change over time. **Always fetch the latest values** from the official docs before citing specific numbers:

- **Limits:** https://developers.cloudflare.com/workflows/reference/limits/
- **Pricing:** https://developers.cloudflare.com/workflows/reference/pricing/

Key areas to check: CPU time per step, max steps per workflow, concurrent instance limits, step return size, event payload size, instance creation rate, subrequest limits, state retention period, and name/ID length constraints.

**Behavioral notes** (stable, not subject to number changes):
- `step.sleep()` and `step.waitForEvent()` don't count toward the max steps limit
- Instances in `waiting` state (sleeping, waiting for event, waiting for retry) don't count toward the concurrent instance limit
- CPU time is active processing only — network I/O, DB queries, and sleeps are wall-clock time, not CPU time
- `waitForEvent` type and workflow/instance names follow pattern `^[a-zA-Z0-9_][a-zA-Z0-9-_]*$`

## References

- [Official Docs](https://developers.cloudflare.com/workflows/)
- [Get Started Guide](https://developers.cloudflare.com/workflows/get-started/guide/)
- [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)
- [REST API](https://developers.cloudflare.com/api/resources/workflows/)
- [Examples](https://developers.cloudflare.com/workflows/examples/)
- [Limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Pricing](https://developers.cloudflare.com/workflows/reference/pricing/)

See: [README.md](./README.md), [configuration.md](./configuration.md), [api.md](./api.md), [patterns.md](./patterns.md)
