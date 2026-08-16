ARG PLANE_IMAGE_FRONTEND
ARG PLANE_IMAGE_BACKEND
ARG PLANE_IMAGE_SPACE
ARG PLANE_IMAGE_ADMIN
ARG PLANE_IMAGE_LIVE
ARG PLANE_IMAGE_PROXY
FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

# **************************************************
#  STAGE 0: Image Loading
# **************************************************
FROM node:22-alpine AS node

FROM ${PLANE_IMAGE_FRONTEND} AS web-img
FROM ${PLANE_IMAGE_BACKEND} AS backend-img
FROM ${PLANE_IMAGE_SPACE} AS space-img
FROM ${PLANE_IMAGE_ADMIN} AS admin-img
FROM ${PLANE_IMAGE_LIVE} AS live-img
FROM ${PLANE_IMAGE_PROXY} AS proxy-img

# **************************************************
#  STAGE 1: Runner
# **************************************************
FROM python:3.12.10-alpine AS runner

WORKDIR /app

RUN apk add --no-cache \
    "libpq" \
    "libxslt" \
    "xmlsec"


COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

COPY --from=web-img /usr/share/nginx/html /app/web
COPY --from=space-img /app /app/space
COPY --from=admin-img /usr/share/nginx/html/god-mode /app/admin
COPY --from=live-img /app /app/live

RUN rm -rf /app/space/apps/space/.next/cache

COPY --from=proxy-img /usr/bin/caddy /usr/bin/caddy
COPY dist/Caddyfile /app/proxy/Caddyfile

COPY --from=backend-img /code /app/backend
COPY --from=backend-img /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=backend-img /usr/local/bin/ /usr/local/bin/

RUN apk add --no-cache nss-tools bash curl uuidgen ncdu vim

RUN pip install supervisor
RUN mkdir -p /etc/supervisor/conf.d

COPY start.sh /app/start.sh
COPY dist/plane.env /app/plane.env
COPY supervisor.conf /etc/supervisor/conf.d/supervisor.conf

RUN mkdir -p /app/logs/access && \
    mkdir -p /app/logs/error && \
    mkdir -p /app/data && \
    chmod +x /app/start.sh

VOLUME ["/app/data", "/app/logs"]

ARG PLANE_GIT_REVISION=""
ARG PLANE_GIT_SOURCE="https://github.com/AFZidan/plane"
ARG PLANE_BUILD_TIMESTAMP=""
LABEL org.opencontainers.image.revision="${PLANE_GIT_REVISION}"
LABEL org.opencontainers.image.source="${PLANE_GIT_SOURCE}"
LABEL org.opencontainers.image.created="${PLANE_BUILD_TIMESTAMP}"

EXPOSE 80 443

CMD ["/app/start.sh"] 
