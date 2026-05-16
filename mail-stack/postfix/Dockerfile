FROM debian:12-slim

RUN apt-get update && apt-get install -y \
    postfix \
    postfix-pcre \
    ca-certificates \
    libsasl2-modules \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 25 465 587

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
