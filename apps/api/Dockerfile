# Stage 1: Builder - Install dependencies with uv
FROM python:3.12.10-alpine AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image
COPY . /app/

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked


# Stage 2: Production - Lean runtime image
FROM python:3.12.10-alpine AS production

# Set working directory
WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source code
COPY . ./plane

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose Django default port
EXPOSE 8000

# Set working directory to Django project
WORKDIR /app/plane

# Run Django development server (replace with gunicorn/uwsgi for production)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
