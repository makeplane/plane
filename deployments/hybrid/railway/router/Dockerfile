FROM tailscale/tailscale:v1.104.4 AS tailscale

FROM caddy:2.11.8-alpine

COPY --from=tailscale /usr/local/bin/tailscale /usr/local/bin/tailscale
COPY --from=tailscale /usr/local/bin/tailscaled /usr/local/bin/tailscaled

COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /usr/local/bin/router-entrypoint
RUN chmod 0755 /usr/local/bin/router-entrypoint

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/router-entrypoint"]
