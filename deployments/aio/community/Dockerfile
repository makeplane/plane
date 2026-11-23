ARG PLANE_VERSION=v0.27.1
FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

# **************************************************
#  STAGE 0: Image Loading
# **************************************************
FROM node:22-alpine AS node

FROM makeplane/plane-frontend:${PLANE_VERSION} AS web-img
FROM makeplane/plane-backend:${PLANE_VERSION} AS backend-img
FROM makeplane/plane-space:${PLANE_VERSION} AS space-img
FROM makeplane/plane-admin:${PLANE_VERSION} AS admin-img
FROM makeplane/plane-live:${PLANE_VERSION} AS live-img
FROM makeplane/plane-proxy:${PLANE_VERSION} AS proxy-img

# **************************************************
#  STAGE 1: Runner
# **************************************************
FROM python:3.12.12-alpine AS runner

WORKDIR /app

# grpcio ships its own roots.pem, which still trusts emSign ECC Root CA - G3 (eMudhra incident);
# point it at the system bundle, which the OS update below keeps current.
ENV GRPC_DEFAULT_SSL_ROOTS_FILE_PATH=/etc/ssl/certs/ca-certificates.crt

# OS security updates. --available forces reinstall from the current repos;
# bump APK_SECURITY_PATCH to bust buildx's cached layer (keyed on this command
# string), otherwise a rebuild silently re-ships the old packages.
ARG APK_SECURITY_PATCH=2026-10-26
RUN echo "apk-security-patch ${APK_SECURITY_PATCH}" && apk update && apk upgrade --no-cache --available

# The node binary only links libstdc++ and libgcc_s from /usr/lib, so install
# them from apk instead of copying node:22-alpine's whole /usr/lib. That copy
# overwrote the libraries upgraded above (libcrypto, libssl, libz, libapk) with
# node's copies from a different Alpine release, shipping unpatched versions
# and breaking /sbin/apk.
RUN apk add --no-cache \
    "libstdc++" \
    "libgcc" \
    "libpq" \
    "libxslt" \
    "xmlsec" \
    "nss-tools" \
    "bash" \
    "curl" \
    "uuidgen" \
    "ncdu" \
    "vim"

COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

# The copy above re-introduces node:22-alpine's npm, whose bundled dependencies
# carry known vulnerabilities (pacote, ip-address, brace-expansion, tar,
# sigstore) -- the per-service images strip npm, so without this the AIO is the
# only place they come back. npm is not needed at runtime: the space program in
# supervisor.conf execs its react-router-serve bin shim directly rather than
# going through npx.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=web-img /usr/share/caddy/html /app/web
COPY --from=space-img /app /app/space
COPY --from=admin-img /usr/share/caddy/html/god-mode /app/admin
COPY --from=live-img /app /app/live

RUN rm -rf /app/space/apps/space/.next/cache

COPY --from=proxy-img /usr/bin/caddy /usr/bin/caddy
COPY dist/Caddyfile /app/proxy/Caddyfile

COPY --from=backend-img /code /app/backend
COPY --from=backend-img /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=backend-img /usr/local/bin/ /usr/local/bin/

RUN pip install supervisor

# pip is only needed for the install above. The runner base's own pip (25.0.1)
# vendors a certifi that still trusts the compromised emSign G3 root
# (GHSA-6q48-6c7w-9gw2), so drop it before the image ships.
RUN rm -rf /usr/local/lib/python3.12/site-packages/pip \
           /usr/local/lib/python3.12/site-packages/pip-*.dist-info \
           /usr/local/bin/pip /usr/local/bin/pip3 /usr/local/bin/pip3.12
RUN mkdir -p /etc/supervisor/conf.d

COPY start.sh /app/start.sh
COPY dist/plane.env /app/plane.env
COPY supervisor.conf /etc/supervisor/conf.d/supervisor.conf

RUN mkdir -p /app/logs/access && \
    mkdir -p /app/logs/error && \
    mkdir -p /app/data && \
    chmod +x /app/start.sh

VOLUME ["/app/data", "/app/logs"]

EXPOSE 80 443

CMD ["/app/start.sh"] 
