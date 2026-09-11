FROM node:22-alpine AS jsbuild
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:/pnpm/bin:$PATH
ENV CI=1
ENV TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN pnpm add -g turbo@2.9.18
RUN pnpm install --frozen-lockfile
RUN turbo run build --filter=web --filter=admin --filter=live

FROM python:3.12.10-alpine AS apibuild
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /code
RUN apk add --no-cache libpq libxslt xmlsec ca-certificates openssl libffi-dev
COPY apps/api/requirements.txt ./requirements.txt
COPY apps/api/requirements ./requirements
RUN apk add --no-cache --virtual .build-deps \
    "bash~=5.2" g++ gcc cargo git make postgresql-dev libc-dev linux-headers \
    && pip install -r requirements.txt --compile --no-cache-dir \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*
COPY apps/api/manage.py manage.py
COPY apps/api/plane plane/
COPY apps/api/templates templates/
COPY apps/api/package.json package.json
COPY apps/api/bin ./bin/
RUN apk add --no-cache "bash~=5.2" && mkdir -p /code/plane/logs && chmod +x ./bin/*

FROM caddy:2.11.3-alpine AS caddyimg

FROM python:3.12.10-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libpq libxslt xmlsec ca-certificates openssl nss-tools bash curl

COPY --from=jsbuild /usr/lib /usr/lib
COPY --from=jsbuild /usr/local/lib /usr/local/lib
COPY --from=jsbuild /usr/local/include /usr/local/include
COPY --from=jsbuild /usr/local/bin /usr/local/bin
COPY --from=apibuild /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=apibuild /usr/local/bin/ /usr/local/bin/

COPY --from=caddyimg /usr/bin/caddy /usr/bin/caddy

COPY --from=apibuild /code /app/backend
COPY --from=jsbuild /app/apps/web/build/client /app/web
COPY --from=jsbuild /app/apps/admin/build/client /app/admin

COPY --from=jsbuild /app/packages /app/live/packages
COPY --from=jsbuild /app/node_modules /app/live/node_modules
COPY --from=jsbuild /app/apps/live/dist /app/live/apps/live/dist
COPY --from=jsbuild /app/apps/live/node_modules /app/live/apps/live/node_modules
COPY --from=jsbuild /app/apps/live/package.json /app/live/apps/live/package.json

RUN pip install supervisor --no-cache-dir
RUN mkdir -p /etc/supervisor/conf.d /app/logs /app/data /app/proxy

COPY deploy/railway/Caddyfile /app/proxy/Caddyfile
COPY deploy/railway/supervisor.conf /etc/supervisor/conf.d/supervisor.conf
COPY deploy/railway/start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
