# Testhub runner — allowlisted Python jobs against a bind-mounted test repo.

Local Plane (`docker-compose-local.yml`) mounts `TESTHUB_HOST_REPO`
at `/opt/testhub/workdir` and talks to this service at `http://testhub-runner:8090`.

On start the container runs `uv sync` in the mounted repo (Linux venv — do not
reuse a Windows host `.venv`). `GET /v1/health` reports workdir + git branch/sha.

```
GET  /v1/health
POST /v1/exec   {"job_id", "argv": ["python", "-m", "apps.index_platform", "--out", "-"], "timeout": 180}
```

Allowlisted argv only: `python -m apps.index_platform|apps.index_ai|packages.action_words`
or `python apps/dump_ddl.py`. Secrets matching password/token/key patterns are
redacted from stdout/stderr. The API container must not subprocess the test repo.
