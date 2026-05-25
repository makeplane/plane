# Security notes — zebaria/plane fork

This is a public fork of makeplane/plane. Treat it as such:

1. **Never commit secrets.** Real Slack signing secrets, Plane API
   tokens, Cognito client secrets, AWS access keys, OAuth credentials,
   and DB passwords belong in AWS Secrets Manager (managed by the
   `corpinfra` repo), not in this repo.

2. **Two automatic guards run on every push/PR:**
   - `.github/workflows/zebaria-secret-scan.yml` (gitleaks). Hard-fails
     on AWS keys, Slack tokens, private keys, and patterns from
     `.gitleaks.toml`. Configure branch protection on `preview` and
     `main` to require this check before merge.
   - GitHub native secret scanning + push protection. Enabled at the
     repo level — blocks pushes containing recognized secret formats
     before they reach the server.

3. **CI uses OIDC, not long-lived AWS keys.** The `gh-actions-zebaria-plane`
   IAM role (created by `corpinfra/terraform/modules/plane_dev/oidc.tf`)
   trusts only this repo. The only repo secret needed is
   `AWS_ACCOUNT_ID`, which gets masked in logs.

4. **Be careful when rebasing on upstream.** A malicious upstream commit
   could try to add a workflow that exfiltrates secrets. Always review
   `.github/workflows/*.yml` changes during rebases. If anything looks
   off, disable the workflow before pushing.

5. **Never reference internal hostnames or AWS resource IDs in code or
   docs in this fork** unless they're already public (e.g. the public
   DNS name `plane.wildzebra.com` is fine; an internal RDS endpoint or
   private subnet ID is not).

6. **The Slack manifest** and any integration-related docs go in
   `corpinfra/terraform/modules/plane/` — never in this fork.