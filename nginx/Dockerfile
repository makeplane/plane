FROM nginx:1.25.0-alpine

RUN apk add --no-cache certbot certbot-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/nginx.conf.template

COPY ./env.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]

