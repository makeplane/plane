ARG PLANE_VERSION=v1.14.0
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
FROM artifacts.plane.so/makeplane/plane-pi-commercial:${PLANE_VERSION} AS pi-img
FROM artifacts.plane.so/makeplane/iframely:v1.2.0 AS iframely-img

# **************************************************
#  STAGE 1: Runner
# **************************************************
FROM python:3.12.10-alpine AS runner

WORKDIR /app

RUN apk add --no-cache \
    "libpq" \
    "libxslt" \
    "xmlsec" \
    "openldap-dev" \
    && addgroup -g 1000 plane \
    && adduser -u 1000 -G plane -D plane
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

COPY --from=web-img /usr/share/nginx/html /app/web
COPY --from=space-img /app /app/space
COPY --from=admin-img /usr/share/nginx/html/god-mode /app/admin
COPY --from=live-img /app /app/live
COPY --from=silo-img /app /app/silo
COPY --from=iframely-img /iframely /app/iframely
COPY --from=monitor-img /usr/local/bin/prime-monitor /usr/local/bin/prime-monitor

RUN mkdir -p /app/monitor && \
    chmod +x /usr/local/bin/prime-monitor

RUN rm -rf /app/space/apps/space/.next/cache

COPY --from=proxy-img /usr/bin/caddy /usr/bin/caddy
COPY dist/Caddyfile /app/proxy/Caddyfile

COPY LICENSE.txt .
RUN mkdir -p /usr/share/licenses/plane/
COPY LICENSE.txt /usr/share/licenses/plane/LICENSE.txt

COPY --from=email-img /opt/email /app/email


COPY --from=backend-img /code /app/backend
COPY --from=backend-img /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=backend-img --exclude=python* /usr/local/bin/ /usr/local/bin/

COPY --from=pi-img /app/pi /app/pi
COPY --from=pi-img /app/bin /app/pi/bin
COPY --from=pi-img /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=pi-img --exclude=python* /usr/local/bin/ /usr/local/bin/

RUN apk add --no-cache nss-tools bash curl uuidgen ncdu vim supervisor

COPY start.sh /app/start.sh
COPY dist/plane.env /app/plane.env
COPY supervisor.conf /app/supervisor.conf

RUN mkdir -p /app/logs/access /app/logs/error /app/data /app/email/tls && \
    chown -R plane:plane /app && \
    chmod +x /app/start.sh

VOLUME ["/app/data", "/app/logs", "/app/monitor", "/app/email/tls"]

EXPOSE 80 443 10025 10465 10587

USER plane

CMD ["/app/start.sh"] 
