# Testhub runner — allowlisted Python jobs and public HTTPS git clone/fetch.

Local Plane (`docker-compose-local.yml`) mounts `TESTHUB_HOST_REPO`
at `/opt/testhub/workdir` and a named volume at `/opt/gitsync/clones`.
The API talks to this service at `http://testhub-runner:8090`.

On start the container runs `uv sync` in the mounted local-mount repo (Linux
venv — do not reuse a Windows host `.venv`). `GET /v1/health` reports that
workdir + git branch/sha.

```
GET  /v1/health
POST /v1/exec      {"job_id", "argv": [...], "timeout": 180, "workdir"?}
POST /v1/git-sync  {"repo_url", "branch", "workdir", "timeout"?}
```

`/v1/exec` allowlisted argv only: `python -m apps.<snake_module>` (for example
`apps.index_platform`, `apps.action_runner`). No `python apps/foo.py`, no
`packages.action_words`. Optional `workdir` must be under `/opt/testhub/` or
`/opt/gitsync/clones/`; default is `TESTHUB_WORKDIR`.

`/v1/git-sync` clones or fetches a **public HTTPS** repo into `workdir` under
`/opt/gitsync/clones/{project}/{remote}`. Fixed git argv only — no credentials,
no extra flags. Existing clones must keep the same origin URL.

If the runner logs `GnuTLS, handshake failed` / `unexpected eof while reading`
while the Windows host can still `git ls-remote` via a mirror, Docker Desktop
is not completing TLS to GitHub. Copy `local.env.example` to `local.env` (proxy

- optional `GITSYNC_GITHUB_INSTEADOF`) and restart the runner.

Secrets matching password/token/key patterns are redacted from stdout/stderr.
The API container must not subprocess git or the test repo.
