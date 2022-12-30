FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app

RUN apk add curl

RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" -o /bin/pnpm; chmod +x /bin/pnpm;

ENV PNPM_HOME="pnpm"
ENV PATH="${PATH}:./pnpm"

COPY ./apps ./apps
COPY ./package.json ./package.json
COPY ./.eslintrc.json ./.eslintrc.json
COPY ./turbo.json ./turbo.json
COPY ./pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm add -g turbo
RUN turbo prune --scope=app --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:18-alpine AS installer

RUN apk add curl

RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" -o /bin/pnpm; chmod +x /bin/pnpm;

ENV PNPM_HOME="pnpm"
ENV PATH="${PATH}:./pnpm"

RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo run build --filter=app...

# Base Image
FROM python:3.8.14-alpine3.16 AS runner




VOLUME [ "/plane-stacks" ]

# Frontend

RUN apk --update --no-cache add \
    "libpq~=14" \
    "libxslt~=1.1" \
    "nodejs-current~=18" \
    "xmlsec~=1.2"

WORKDIR /opt/plane

# Don't run production as root
RUN addgroup -S plane && \
    adduser -S captain -G plane

USER captain

COPY --from=installer /app/apps/app/next.config.js .
COPY --from=installer /app/apps/app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=captain:plane /app/apps/app/.next/standalone ./
COPY --from=installer --chown=captain:plane /app/apps/app/.next/static ./apps/app/.next/static

EXPOSE 3000

# Backend

USER root


ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 


COPY ./apiserver/requirements.txt ./
COPY ./apiserver/requirements ./requirements
RUN apk add libffi-dev
RUN apk --update --no-cache --virtual .build-deps add \
    "bash~=5.1" \
    "g++~=11.2" \
    "gcc~=11.2" \
    "cargo~=1.60" \
    "git~=2" \
    "make~=4.3" \
    "postgresql13-dev~=13" \
    "libc-dev" \
    "linux-headers" \
    && \
    pip install -r requirements.txt --compile --no-cache-dir \
    && \
    apk del .build-deps


RUN chown captain.plane /opt/plane

# Add in Django deps and generate Django's static files
COPY ./apiserver/manage.py manage.py
COPY ./apiserver/plane plane/
COPY ./apiserver/templates templates/

COPY ./apiserver/gunicorn.config.py ./
USER root
RUN apk --update --no-cache add "bash~=5.1"
COPY ./apiserver/bin ./bin/
USER captain

# Add bootstrapfile
COPY ./scripts ./scripts/

# Expose container port and run entry point script
EXPOSE 8000

USER root

RUN apk --update add supervisor

RUN chmod +x scripts/entrypoint.sh scripts/docker.env.sh scripts/run_env.sh 

COPY supervisord.conf /etc/supervisor/supervisord.conf
ENTRYPOINT [ "/opt/plane/scripts/entrypoint.sh" ]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf", "-n"]
