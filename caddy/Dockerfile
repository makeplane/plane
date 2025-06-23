FROM makeplane/caddy:latest

COPY ./Caddyfile.template /etc/caddy/Caddyfile

COPY ./caddy.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]