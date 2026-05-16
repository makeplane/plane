FROM debian:12-slim

RUN apt-get update && apt-get install -y \
    dovecot-core \
    dovecot-imapd \
    dovecot-lmtpd \
    dovecot-sieve \
    dovecot-managesieved \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 5000 vmail && useradd -g vmail -u 5000 vmail -d /var/mail/vhosts -m

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 143 993

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
