# CI/CD Fix Workflow

For GitHub Actions failures and CI/CD pipeline issues.

## Prerequisites
- `gh` CLI installed and authorized
- GitHub Actions URL or run ID

## Workflow

1. **Fetch logs** with `debugger` agent:
   ```bash
   gh run view <run-id> --log-failed
   gh run view <run-id> --log
   ```

2. **Analyze** root cause from logs

3. **Implement fix** based on analysis

4. **Test locally** with `tester` agent before pushing

5. **Iterate** if tests fail, repeat from step 3

## Notes
- If `gh` unavailable, instruct user to install: `gh auth login`
- Check both failed step and preceding steps for context
- Common issues: env vars, dependencies, permissions, timeouts
