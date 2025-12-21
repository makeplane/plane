# Stage 1: Builder - Install dependencies with uv
FROM python:3.12.10-alpine AS builder-with-tools

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.18 /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install build dependencies and runtime dependencies
RUN apk add --no-cache --virtual .build-deps \
    gcc=14.2.0-r6 \
    musl-dev=1.2.5-r10 \
    python3-dev=3.12.12-r0 \
    linux-headers=6.14.2-r0 \
    libpq-dev=17.7-r0 \
    libxslt-dev=1.1.43-r3 \
    xmlsec-dev=1.3.7-r0 \
    && apk add --no-cache \
    bash=5.2.37-r0 \
    libpq=17.7-r0 \
    libxslt=1.1.43-r3 \
    xmlsec=1.3.7-r0

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image
COPY . /app/
ENV PATH="/app/.venv/bin:$PATH"

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked \
    && apk del .build-deps


# Optional dev environment
FROM builder-with-tools AS dev
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --group local

CMD [ "./bin/docker-entrypoint-api-local.sh" ]


# Optional test environment
FROM builder-with-tools AS test
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --group test


# Remove build deps for cleaner builder
FROM builder-with-tools AS builder
RUN apk del .build-deps


# Stage 2: Production - Lean runtime image
FROM builder AS production

# Install only runtime dependencies
RUN apk add --no-cache \
    bash=5.2.37-r0 \
    libpq=17.7-r0 \
    libxslt=1.1.43-r3 \
    xmlsec=1.3.7-r0

# Copy the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY --from=builder /app /app

# Set working directory
WORKDIR /app

# Set PATH to include virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Expose Django default port
EXPOSE 8000

CMD ["./bin/docker-entrypoint-api.sh"]