FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TESTHUB_WORKDIR=/opt/testhub/workdir \
    TESTHUB_RUNNER_PORT=8090

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.8.4 /uv /usr/local/bin/uv

WORKDIR /opt/testhub-runner
COPY whitelist.py server.py git_sync.py entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8090
ENTRYPOINT ["./entrypoint.sh"]
