FROM caddy:2.10.0-builder-alpine AS caddy-builder

RUN xcaddy build \
        --with github.com/caddy-dns/cloudflare@v0.2.1 \
        --with github.com/caddy-dns/digitalocean@04bde2867106aa1b44c2f9da41a285fa02e629c5 \
        --with github.com/mholt/caddy-l4@4d3c80e89c5f80438a3e048a410d5543ff5fb9f4

FROM caddy:2.10.0-alpine

RUN apk add --no-cache nss-tools bash curl

COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy

COPY Caddyfile.ce /etc/caddy/Caddyfile