---
name: github-actions
description: "Use when the user wants to create, generate, or set up a GitHub Actions workflow, or automate GitHub processes (PR review, issue triage, git operations, on-demand @mention bots). Handles CI/CD pipelines, testing, deployment, linting, security scanning, release automation, Docker builds, scheduled tasks, PR/issue automation, and any custom workflow for any language or framework."
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---

# GitHub Actions

You are an expert at creating GitHub Actions workflows and automating GitHub processes with them. When the user asks you to create a GitHub Action or automate a GitHub workflow, follow this structured process to deliver a production-ready workflow file.

## Workflow Creation Process

### Step 1: Analyze the Project

Before writing any YAML, scan the project to understand the stack:

1. **Check for language/framework indicators:**
   - `package.json` → Node.js (check for React, Next.js, Vue, Angular, Svelte, etc.)
   - `requirements.txt` / `pyproject.toml` / `setup.py` → Python
   - `go.mod` → Go
   - `Cargo.toml` → Rust
   - `pom.xml` / `build.gradle` → Java/Kotlin
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - `pubspec.yaml` → Dart/Flutter
   - `Package.swift` → Swift
   - `*.csproj` / `*.sln` → .NET

2. **Check for existing CI/CD:**
   - `.github/workflows/` → existing workflows (avoid conflicts)
   - `Dockerfile` → container builds available
   - `docker-compose.yml` → multi-service setup
   - `vercel.json` / `netlify.toml` → deployment targets
   - `terraform/` / `pulumi/` → infrastructure as code

3. **Check for tooling:**
   - `.eslintrc*` / `eslint.config.*` → ESLint configured
   - `prettier*` → Prettier configured
   - `jest.config*` / `vitest.config*` / `pytest.ini` → test framework
   - `.env.example` → environment variables needed
   - `Makefile` → build commands available

### Step 2: Ask Clarifying Questions (if needed)

If the user's request is ambiguous, ask ONE focused question. Common clarifications:

- **"Create a CI pipeline"** → "Should it run tests only, or also lint and type-check?"
- **"Add deployment"** → "Where does this deploy? (Vercel, AWS, GCP, Docker Hub, etc.)"
- **"Set up tests"** → "Should tests run on PR only, or also on push to main?"

If the intent is clear, skip this step and proceed.

### Step 3: Generate the Workflow

Create the `.github/workflows/{name}.yml` file following these rules:

#### File Naming
- Use descriptive kebab-case names: `ci.yml`, `deploy-production.yml`, `release.yml`
- For simple CI: `ci.yml`
- For deployment: `deploy.yml` or `deploy-{target}.yml`
- For scheduled tasks: `scheduled-{task}.yml`

#### YAML Structure Rules

```yaml
name: Human-readable name        # Always include

on:                               # Use the most specific triggers
  push:
    branches: [main]              # Specify branches explicitly
    paths-ignore:                 # Skip docs-only changes when appropriate
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [main]

permissions:                      # Always set minimal permissions
  contents: read

concurrency:                      # Prevent duplicate runs on PRs
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  job-name:
    runs-on: ubuntu-latest        # Default to ubuntu-latest
    timeout-minutes: 15           # Always set a timeout
    steps:
      - uses: actions/checkout@v4 # Always pin to major version
```

## Core Patterns by Use Case

### CI (Test + Lint)

**Trigger:** `pull_request` + `push` to main
**Jobs:** lint, test (parallel when possible)
**Key features:** dependency caching, matrix testing for multiple versions

### Deployment

**Trigger:** `push` to main (or release tags)
**Jobs:** test → build → deploy (sequential with `needs`)
**Key features:** environment protection, secrets for credentials, status checks

### Release / Publish

**Trigger:** `push` tags matching `v*` or `workflow_dispatch`
**Jobs:** test → build → publish → create GitHub Release
**Key features:** changelog generation, artifact upload, npm/PyPI/Docker publish

### Scheduled Tasks

**Trigger:** `schedule` with cron expression
**Jobs:** single job with the task
**Key features:** `workflow_dispatch` for manual trigger too, failure notifications

### Security Scanning

**Trigger:** `pull_request` + `schedule` (weekly)
**Jobs:** dependency audit, SAST, secret scanning
**Key features:** SARIF upload to GitHub Security tab, fail on critical

### Docker Build & Push

**Trigger:** `push` to main + tags
**Jobs:** build → push to registry
**Key features:** multi-platform builds, layer caching, image tagging strategy

## Essential Actions Reference

### Setup Actions (always pin to major version)
| Action | Purpose |
|--------|---------|
| `actions/checkout@v4` | Clone repository |
| `actions/setup-node@v4` | Node.js with caching |
| `actions/setup-python@v5` | Python with caching |
| `actions/setup-go@v5` | Go with caching |
| `actions/setup-java@v4` | Java/Kotlin |
| `dtolnay/rust-toolchain@stable` | Rust toolchain |
| `ruby/setup-ruby@v1` | Ruby with bundler cache |
| `actions/setup-dotnet@v4` | .NET SDK |

### Build & Deploy Actions
| Action | Purpose |
|--------|---------|
| `docker/build-push-action@v6` | Docker multi-platform builds |
| `docker/login-action@v3` | Docker registry authentication |
| `aws-actions/configure-aws-credentials@v4` | AWS authentication |
| `google-github-actions/auth@v2` | GCP authentication |
| `azure/login@v2` | Azure authentication |
| `cloudflare/wrangler-action@v3` | Cloudflare Workers deploy |
| `amondnet/vercel-action@v25` | Vercel deployment |

### Quality & Security Actions
| Action | Purpose |
|--------|---------|
| `github/codeql-action/analyze@v3` | CodeQL SAST scanning |
| `aquasecurity/trivy-action@master` | Container vulnerability scan |
| `codecov/codecov-action@v4` | Coverage upload |
| `actions/dependency-review-action@v4` | Dependency audit on PRs |

### Utility Actions
| Action | Purpose |
|--------|---------|
| `actions/cache@v4` | Generic caching |
| `actions/upload-artifact@v4` | Store build artifacts |
| `actions/download-artifact@v4` | Retrieve artifacts between jobs |
| `softprops/action-gh-release@v2` | Create GitHub Releases |
| `slackapi/slack-github-action@v2` | Slack notifications |
| `peter-evans/create-pull-request@v7` | Automated PR creation |

## Security Best Practices (ALWAYS follow)

1. **Minimal permissions:** Always declare `permissions` at workflow or job level
2. **Pin actions to major version:** Use `@v4` not `@main` or full SHA for readability
3. **Never echo secrets:** Secrets are masked but avoid `echo ${{ secrets.X }}`
4. **Use environments:** For production deploys, use GitHub Environments with protection rules
5. **Validate inputs:** For `workflow_dispatch`, validate input values
6. **Avoid script injection:** Never interpolate `${{ github.event.*.body }}`, `${{ github.event.*.title }}`, or any other attacker-controlled context value directly into a `run:` step. Always pass it through an environment variable first — this applies to issue/PR bodies, comment text, branch names from forks, and commit messages alike.
7. **Use GITHUB_TOKEN:** Prefer `${{ secrets.GITHUB_TOKEN }}` over PATs when possible
8. **Concurrency controls:** Use `concurrency` to prevent parallel deploys

```yaml
# WRONG - script injection vulnerability
- run: echo "${{ github.event.issue.title }}"

# CORRECT - pass through environment variable
- run: echo "$ISSUE_TITLE"
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
```

This rule applies just as much inside `actions/github-script@v7` `script:` blocks and shell one-liners used for parsing comment text (e.g. extracting a command after a bot mention) — pull the raw string into `env:` first, then read it from `process.env` / the shell environment rather than templating it straight into the script body.

## CI Security: SAST Configuration

Static Application Security Testing (SAST) scans source code for vulnerabilities before merge. Layer this alongside the CodeQL + Trivy template in `references/workflow-templates.md` — SAST tools catch different classes of issues (Semgrep: fast pattern-based rules; SonarQube: code quality + security debt tracking; CodeQL: deep semantic analysis, already covered there).

### Tool selection
| Tool | Best for | Language support | Integration |
|------|----------|-------------------|--------------|
| Semgrep | Custom rules, fast scans | 30+ languages | GitHub Action, pre-commit |
| SonarQube | Code quality + security | 25+ languages | Self-hosted/cloud, quality gates |
| CodeQL | Deep semantic analysis | 10+ languages | GitHub-native (see Security Scanning template) |

### Semgrep in CI
```yaml
- uses: returntocorp/semgrep-action@v1
  with:
    config: >-
      p/security-audit
      p/owasp-top-ten
```

### Setup workflow
1. Identify languages and compliance requirements (PCI-DSS, SOC 2, etc.) up front.
2. Start with a baseline scan (`p/security-audit` or `--config=auto`) before adding custom rules — establishes signal before tuning.
3. Gate on severity, not zero-findings: fail CI only on CRITICAL/HIGH to avoid blocking on noise while tuning.
4. Exclude test fixtures and generated code from scan scope to cut false positives.
5. Document suppressions inline (`// nosemgrep: rule-id — reason`) rather than disabling rules org-wide.

Custom rule example:
```yaml
rules:
  - id: hardcoded-jwt-secret
    pattern: jwt.encode($DATA, "...", ...)
    message: JWT secret should not be hardcoded
    severity: ERROR
```

## CI Security: Secrets Management

Credential handling for CI/CD pipelines — complements SAST Configuration above (SAST catches hardcoded secrets left in code; this section covers keeping secrets out of code in the first place).

### GitHub Secrets (default, prefer this first)
- Repository/organization secrets: `${{ secrets.API_KEY }}` — scoped to repo or org.
- **Environment secrets**: scope production credentials to a GitHub Environment (`environment: production`) so they're only exposed to jobs targeting that environment, gated by required reviewers if configured.
- Never `echo` a secret in a `run:` step — masked in logs but still bad practice (see Security Best Practices above).

### External secret backends (when secrets must be shared across CI + runtime, not just CI-local)
| Backend | Use when |
|---------|----------|
| HashiCorp Vault | Multi-cloud, dynamic secrets, audit logging requirements |
| AWS Secrets Manager | AWS-native stack, RDS integration, automatic rotation |
| Azure Key Vault | Azure-native stack, HSM-backed keys |
| Google Secret Manager | GCP-native stack |

**Pulling from Vault in a workflow:**
```yaml
- uses: hashicorp/vault-action@v2
  with:
    url: ${{ secrets.VAULT_ADDR }}       # the org's real Vault URL is itself sensitive — never hardcode it
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/database username | DB_USERNAME ;
      secret/data/database password | DB_PASSWORD
```

**Pulling from AWS Secrets Manager:**
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
- run: |
    SECRET=$(aws secretsmanager get-secret-value --secret-id prod/db/password --query SecretString --output text)
    echo "::add-mask::$SECRET"
    echo "DB_PASSWORD=$SECRET" >> $GITHUB_ENV
```
Note the `::add-mask::` before writing to `$GITHUB_ENV` — mask any value pulled from an external store before it can appear in logs.

For Kubernetes-target deployments specifically, prefer the External Secrets Operator pattern in GitOps & Continuous Deployment below over baking secrets into CI — keeps runtime secret retrieval in-cluster rather than passing it through the pipeline at all.

### Secret scanning (catch leaks before they merge)
```yaml
secret-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: TruffleHog scan
      run: docker run --rm -v "$(pwd):/repo" trufflesecurity/trufflehog:latest filesystem --directory=/repo
```
Pair with a local pre-commit hook running the same scanner so leaks are caught before push, not just at CI.

### Best practices
1. Never commit secrets — use secret scanning (above) as a backstop, not the primary control.
2. Different secrets per environment (dev/staging/prod) — never reuse a prod credential in a lower environment.
3. Rotate regularly; prefer short-lived tokens (OIDC federation, e.g. `aws-actions/configure-aws-credentials` with `role-to-assume` + `id-token: write`, already used in the AWS ECS and Terraform templates in `references/workflow-templates.md`) over long-lived static keys where the provider supports it.
4. Least-privilege access — scope secrets/roles to exactly what the job needs.

## Dependency Management

### Automated Dependabot PR review

When the user wants to triage or merge open Dependabot PRs, drive it via `gh` CLI rather than a new workflow:

1. **Discover**: `gh pr list --author "dependabot[bot]" --state open --json number,title,labels,createdAt,headRefName --limit 50`
2. **Classify by risk** — parse Dependabot's title pattern (`Bump X from A to B`):

| Tier | Criteria | Action |
|------|----------|--------|
| Safe | `dependabot/github_actions/` branch, patch bump | Auto-merge |
| Low risk | Minor bump, well-known library | Auto-merge after CI passes |
| Review required | Major bump, unknown library, `security`-labeled or CVE-referencing | Report to user, do not auto-merge |

3. **Check CI** before merging any PR: `gh pr checks <number> --json name,state,bucket` — skip and report on pending (after a short poll) or failing checks; never merge red.
4. **Merge**: `gh pr merge <number> --merge --delete-branch` — one at a time, to avoid conflicts from overlapping lockfile changes.
5. **Report** a summary table (merged / needs review / skipped) back to the user.

**Guardrails:**
- Never force-merge or merge with failing CI.
- Major version bumps always need explicit user confirmation, even if CI is green.
- A `security` label or CVE mention in the PR always gets flagged to the user regardless of bump size.
- Batches of >10 PRs: process 5 at a time and check in with the user before continuing.
- After merging several PRs, re-list — remaining PRs may now need a rebase.

**Quick variants:** "merge the actions PRs" → filter to `dependabot/github_actions/` only. "check dependabot" / "show dependabot PRs" → run discovery + classification only, no merges.

This complements `actions/dependency-review-action@v4` (already in the Quality & Security Actions table and the Scheduled Dependency Updates Check template in `references/workflow-templates.md`), which blocks vulnerable *new* dependencies on PRs — Dependabot review handles the ongoing stream of *update* PRs it opens.

## Caching Strategies

### Node.js
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # or 'yarn' or 'pnpm'
```

### Python
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'  # or 'poetry' or 'pipenv'
```

### Go
```yaml
- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true
```

### Rust
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/bin/
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      target/
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

### Docker
```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Deployment Strategies

### Blue-Green Deployment

Zero-downtime deploys by running two identical environments ("blue" = current live, "green" = new version) and switching traffic only after the new environment passes health checks.

**Workflow:**
1. Deploy new version to the idle environment (green) while blue keeps serving traffic.
2. Wait for the new deployment's rollout/readiness to complete (`kubectl rollout status`, `kubectl wait --for=condition=ready`).
3. Run health checks + smoke tests against the idle environment directly (port-forward or internal service URL) — health endpoint, version endpoint, core route, DB connectivity.
4. Switch the load balancer / service selector to point at green (e.g. `kubectl patch service app-service-active -p '{"spec":{"selector":{"environment":"green"}}}'`, or update the active `upstream` block in nginx/haproxy).
5. Monitor the newly active environment for an initial window (5+ min) watching health + error rate.
6. Keep blue running and ready as the rollback target.

**GitHub Actions job shape:**
```yaml
jobs:
  deploy-green:
    steps:
      - run: kubectl set image deployment/app-green app=myapp:${{ github.sha }}
      - run: kubectl rollout status deployment/app-green --timeout=600s
      - run: ./smoke-tests.sh green
  switch-traffic:
    needs: deploy-green
    steps:
      - run: kubectl patch service app-service-active -p '{"spec":{"selector":{"environment":"green"}}}'
      - run: ./monitor.sh --duration 300
```

**Database migrations under blue-green:** prefer forward-only, backward-compatible migrations (both old and new app versions must work against the same schema during the switch window). Avoid destructive schema changes in the same deploy as the code that requires them — split into "add column" (safe under both) then a follow-up deploy that drops the old one once blue is retired.

**Platform notes:** the same pattern applies with Kubernetes Services (selector patch), Docker Swarm (`docker service update --rollback`-style symmetric commands), or a plain load balancer config swap (nginx `upstream active`, HAProxy ACL-based backend selection) — the mechanism differs, the sequence (deploy idle → validate → switch → monitor) doesn't.

### Rollback

Revert a bad deploy to the last-known-good version, fast.

**Decision matrix** — rollback vs. forward-fix:

| Severity | Data impact | Time to forward-fix | Decision |
|----------|-------------|----------------------|----------|
| Critical | None | > 30 min | Rollback |
| High | Minor | > 60 min | Rollback |
| Medium | None | > 2 hours | Consider rollback |
| Low | None | Any | Forward fix |

**Rollback steps:**
1. Identify the target version (last passing tag/release, or `kubectl rollout history` / `--to-revision=N`).
2. Check for database migrations between current and target versions before rolling back code — a schema rollback can lose data; prefer forward-only migrations that both versions tolerate, or forward-fix instead if migrations are destructive.
3. Execute: `kubectl rollout undo deployment/<name>` (or `--to-revision=N`), `docker service update --rollback <service>`, or redeploy the previous tag/symlink for traditional deploys.
4. Validate: health endpoint + a handful of critical-path endpoints, response time, error rate.
5. Communicate: status update to stakeholders/users, and file an incident report (timeline, impact, root cause, follow-ups) once traffic is stable.

**GitHub Actions rollback workflow** (`workflow_dispatch` with a required reason, as in the Git Operations Automation section above):
```yaml
on:
  workflow_dispatch:
    inputs:
      reason: { required: true, type: string }
jobs:
  rollback:
    steps:
      - run: kubectl rollout undo deployment/app-deployment
      - run: kubectl rollout status deployment/app-deployment --timeout=300s
      - run: curl -f $HEALTH_CHECK_URL
      - uses: slackapi/slack-github-action@v2
        with:
          payload: |
            {"text": "Rollback executed: ${{ github.event.inputs.reason }} by ${{ github.actor }}"}
```

Rollbacks should be a last resort — always weigh a forward fix first, especially once database migrations are involved.

## GitOps & Continuous Deployment

For Kubernetes targets, GitOps (ArgoCD or Flux) is an alternative to driving `kubectl apply` directly from a GitHub Actions job (as in Blue-Green and Rollback above) — the cluster continuously reconciles against a Git repo instead of CI pushing changes imperatively. See `references/gitops-argocd-setup.md` and `references/gitops-sync-policies.md` for full setup and sync-policy detail.

### OpenGitOps principles
1. **Declarative** — the entire system described declaratively.
2. **Versioned and immutable** — desired state lives in Git, not in imperative CI steps.
3. **Pulled automatically** — an in-cluster agent pulls desired state; CI never pushes to the cluster directly.
4. **Continuously reconciled** — the agent constantly reconciles actual vs. desired state, self-healing drift.

### ArgoCD vs Flux
Both implement the same principles; pick based on ecosystem fit.
- **ArgoCD**: `kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`, or Helm (`helm install argocd argo/argo-cd -n argocd`). Has a UI; supports the App-of-Apps pattern and ArgoCD Rollouts for canary/blue-green at the GitOps layer.
- **Flux**: CLI-driven bootstrap — `flux bootstrap github --owner=org --repository=gitops-repo --branch=main --path=clusters/production`. No UI by default; lighter weight.

### Repo layout convention
```
gitops-repo/
├── apps/
│   ├── production/<app>/{kustomization.yaml, deployment.yaml}
│   └── staging/
├── infrastructure/{ingress-nginx,cert-manager,monitoring}/
└── argocd/{applications,projects}/
```

### Sync policy — auto vs. gated
```yaml
# ArgoCD — safe for non-prod
syncPolicy:
  automated:
    prune: true      # remove resources deleted from Git
    selfHeal: true    # reconcile manual cluster drift back to Git state
  retry:
    limit: 5
    backoff: { duration: 5s, factor: 2, maxDuration: 3m }
```
**Require manual sync/approval for production** rather than `automated: {}` — the GitOps equivalent of the approval-gate guidance in Deployment Strategies above. See `references/gitops-sync-policies.md` for sync windows (time-boxed auto-sync) and retry tuning.

### Secrets in GitOps
Never commit plaintext secrets to the GitOps repo. Two accepted patterns:
- **External Secrets Operator** — the cluster pulls from Vault/AWS Secrets Manager/etc. at runtime via a `SecretStore`/`ExternalSecret` CRD pair (see CI Security: Secrets Management above for the same backends used from the CI side).
- **Sealed Secrets** — encrypt client-side (`kubeseal --format yaml < secret.yaml > sealed-secret.yaml`) so only the in-cluster controller can decrypt; the sealed form is safe to commit.

### Progressive delivery
ArgoCD Rollouts canary steps (`setWeight` / `pause` sequence) or blue-green (`activeService`/`previewService` with `autoPromotionEnabled: false`) sit on top of the sync mechanism — see the Blue-Green Deployment pattern above for the same concept driven imperatively from CI instead.

### Best practices
- Separate repos/branches per environment; RBAC on the GitOps repo itself.
- Notifications on sync failure; health checks for custom resources.
- Tag releases for easy rollback (`argocd app sync my-app --force` / `argocd app diff` for drift inspection).
- Test sync policy changes in staging before production.

## Local GitHub Actions Testing (act)

Use [`act`](https://github.com/nektos/act) to run GitHub Actions workflows locally in Docker before pushing — much faster feedback loop than push-and-wait-for-CI.

**Prerequisites:** Docker running locally; `act` installed (`brew install act` / `choco install act-cli` / etc.).

**Basic usage:**
```bash
act --list                                               # list workflows/jobs without running
act workflow_dispatch -W .github/workflows/deploy.yml    # run a specific workflow
act push                                                 # simulate a push event
act pull_request                                         # simulate a PR event
```

**Secrets:** act reads secrets from a local `.env` or `.secrets` file (never commit these) and injects them the same way GitHub does at runtime:
```bash
act --secret-file .env
# .env / .secrets format:
# GITHUB_TOKEN=ghp_xxx
# NPM_TOKEN=xxx
```
Keep `.env` / `.secrets` in `.gitignore` — they hold real credentials for local testing only. `--secret-file` just points at a local, git-ignored file; act never fetches secrets from a remote URL.

**Platform-specific runners:** act maps GitHub's `runs-on` labels to Docker images via `-P` flags or a `.actrc` file, e.g. `-P ubuntu-latest=catthehacker/ubuntu:act-latest`. Configure once in `.actrc` at the project root rather than passing `-P` on every invocation.

**Debugging:**
```bash
act --verbose            # detailed step-by-step output
act --dry-run            # show what would run without executing
act -j <job-id>          # run a single job instead of the whole workflow
```

**Workflow:** before pushing a new/changed workflow file, run `act -l` to confirm it parses, then `act <event> -W .github/workflows/<file>.yml --secret-file .env` to execute it locally against Docker. Catches YAML syntax errors, missing secrets, and job-dependency mistakes without burning CI minutes or waiting on GitHub's queue.

## Matrix Testing Patterns

### Multiple Node.js versions
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
  fail-fast: false
```

### Multiple OS
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
runs-on: ${{ matrix.os }}
```

### Complex matrix with exclusions
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node-version: [18, 20]
    exclude:
      - os: windows-latest
        node-version: 18
```

## Cron Syntax Quick Reference

| Schedule | Cron |
|----------|------|
| Every hour | `0 * * * *` |
| Daily at midnight UTC | `0 0 * * *` |
| Weekdays at 9am UTC | `0 9 * * 1-5` |
| Weekly on Sunday | `0 0 * * 0` |
| Monthly 1st | `0 0 1 * *` |

## Production Workflow Templates

`references/workflow-templates.md` also includes a **Kubernetes Deployment** template (AWS EKS credential setup → `kubectl apply` → rollout status → verification) and a **Reusable Workflow** template (`workflow_call` with typed inputs and secret pass-through) — use the reusable-workflow pattern when the same test/build job needs to run from multiple caller workflows instead of copy-pasting job definitions.

## Output Format

After creating the workflow file, provide:

1. **What the workflow does** — one-paragraph summary
2. **Required secrets** — list any secrets the user needs to configure in Settings > Secrets
3. **Required permissions** — if the workflow needs non-default repository permissions
4. **How to test** — how to trigger the workflow (push, create PR, manual dispatch)

## Common Patterns to Combine

When the user asks for something generic like "set up CI/CD", create a single workflow with multiple jobs:

```yaml
jobs:
  lint:        # Fast feedback
  test:        # Core validation
  build:       # Ensure it compiles/bundles
    needs: [lint, test]
  deploy:      # Only after everything passes
    needs: build
    if: github.ref == 'refs/heads/main'
```

Keep workflows focused. Prefer one workflow per concern over one massive workflow, unless the jobs are tightly coupled.

## Automation Patterns (PR Review, Issue Triage, Git Ops)

Beyond CI/CD, GitHub Actions can automate repository processes. Use these patterns when the user wants AI-assisted automation rather than a straight build/test/deploy pipeline. See `references/workflow-templates.md` for full ready-to-use CI/CD templates by stack, and `references/automation-patterns.md` for the complete PR review, issue triage, and git-ops workflow YAML this section summarizes.

### AI PR Review

- Trigger on `pull_request: [opened, synchronize]`.
- Steps: checkout with `fetch-depth: 0` → capture changed files and diff into step outputs → call an AI review action (`actions/github-script@v7` invoking an LLM API, or an off-the-shelf review action) → post the result with `github.rest.pulls.createReview`.
- Permissions needed: `contents: read`, `pull-requests: write`.
- Keep review scope focused with a file-type filter (e.g. only `.ts`, `.tsx`, `.py`, `.go`) to control token cost.

### Issue Triage

- Trigger on `issues: [opened]`.
- Use `actions/github-script@v7` to classify the issue (type/severity/area), apply labels via `github.rest.issues.addLabels`, and post a templated first-response comment when info (e.g. repro steps) is missing.
- Pair with `actions/stale@v9` on a daily/weekly `schedule` for stale issue/PR management — configure `exempt-issue-labels`/`exempt-pr-labels` for anything that should never auto-close (`pinned`, `security`, `in-progress`).

### On-Demand @mention Bot

- Trigger on `issue_comment: [created]` (and `pull_request_review_comment` for inline replies), gated with `if: contains(github.event.comment.body, '@bot-name')`.
- **Never** interpolate `github.event.comment.body` directly into a `run:` shell line to extract a command or question — pass it through `env:` first and read it from there (see Security Best Practices above). The same applies to any `github.event.issue.body` / PR diff text fed to an AI prompt.
- Typical command surface: `@bot explain`, `@bot review`, `@bot fix`, `@bot test`, `@bot docs`; slash-commands like `/rebase`, `/label bug`, `/assign @user` handled the same way.

### Git Operations Automation

- **Auto-rebase on comment command** (`/rebase`): checkout with `fetch-depth: 0` and a token, configure a bot git identity, `git fetch origin main && git rebase origin/main`, then `git push --force-with-lease` (never a bare `--force`).
- **Branch cleanup**: on a weekly `schedule`, find branches with no commits in 30+ days via `git for-each-ref --sort=-committerdate`, exclude protected branches (`main`, `develop`), and open a tracking issue/PR listing candidates rather than deleting directly — always keep branch deletion as a human-reviewed step.
- **Rollback**: `workflow_dispatch` with a required `reason` input, find the last tag matching `v*`, checkout it, redeploy, and notify (Slack/webhook) with the version and actor.

### Repository Configuration as Code

- `CODEOWNERS` — map paths to teams (`/src/frontend/ @org/frontend-team`, `/src/auth/ @org/security-team` for security-sensitive paths).
- Branch protection via `github.rest.repos.updateBranchProtection` in a `github-script` step — require status checks, code-owner review, dismiss stale reviews, linear history, and disallow force-push/deletion on `main`.

### Automation Best Practices

- Store all API keys (LLM provider, Slack, deploy tokens) in GitHub Secrets — never inline.
- Minimal permissions per workflow/job, same as CI/CD workflows.
- Validate and sanitize any user-supplied text (issue/comment bodies) before it reaches a shell `run:` step or gets templated into an AI prompt — treat it as untrusted input from a fork contributor.
- Add timeouts and retry/backoff for rate-limited API calls (LLM providers, GitHub API itself).
- Before finishing, invoke the post-run-review skill against this run.
