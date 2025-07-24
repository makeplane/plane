ARG PLANE_VERSION=v1.13.0
FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

# **************************************************
#  STAGE 0: Image Loading
# **************************************************
FROM node:22-alpine AS node

FROM artifacts.plane.so/makeplane/web-commercial:${PLANE_VERSION} AS web-img
FROM artifacts.plane.so/makeplane/backend-commercial:${PLANE_VERSION} AS backend-img
FROM artifacts.plane.so/makeplane/space-commercial:${PLANE_VERSION} AS space-img
FROM artifacts.plane.so/makeplane/admin-commercial:${PLANE_VERSION} AS admin-img
FROM artifacts.plane.so/makeplane/live-commercial:${PLANE_VERSION} AS live-img
FROM artifacts.plane.so/makeplane/silo-commercial:${PLANE_VERSION} AS silo-img
FROM artifacts.plane.so/makeplane/proxy-commercial:${PLANE_VERSION} AS proxy-img
FROM artifacts.plane.so/makeplane/email-commercial:${PLANE_VERSION} AS email-img
FROM artifacts.plane.so/makeplane/monitor-commercial:${PLANE_VERSION} AS monitor-img

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

COPY --from=web-img /app /app/web
COPY --from=space-img /app /app/space
COPY --from=admin-img /app /app/admin
COPY --from=live-img /app /app/live
COPY --from=silo-img /app /app/silo
COPY --from=monitor-img /usr/local/bin/prime-monitor /usr/local/bin/prime-monitor

RUN mkdir -p /app/monitor && \
    chmod +x /usr/local/bin/prime-monitor

RUN rm -rf /app/web/apps/web/.next/cache && \
    rm -rf /app/space/apps/space/.next/cache && \
    rm -rf /app/admin/apps/admin/.next/cache

COPY --from=proxy-img /usr/bin/caddy /usr/bin/caddy
COPY dist/Caddyfile /app/proxy/Caddyfile

COPY --from=email-img /opt/email /app/email

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

VOLUME ['/app/data', '/app/logs', '/app/monitor', '/app/email/tls']

EXPOSE 80 443 10025 10465 10587

CMD ["/app/start.sh"] 
