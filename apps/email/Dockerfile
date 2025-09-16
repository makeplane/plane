FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

FROM golang:1.25.1-alpine3.22 AS builder

WORKDIR /app
RUN apk update && \
	apk upgrade && \
	apk add git && \
	go install github.com/goreleaser/goreleaser/v2@latest

COPY . .

RUN goreleaser build --snapshot --clean --single-target --output=./email-server

FROM alpine:latest AS runner

RUN apk update && \
	apk upgrade && \
	apk add ca-certificates openssl

WORKDIR /opt/email

LABEL maintainer="engineering@plane.so" \
      app="email-server" \
      version="1.0.0"

ENV SMTP_DOMAIN=localhost \
	EMAIL_SAVE_ENDPOINT="" \
	LOG_LEVEL="info" \
	TZ=UTC

COPY --from=builder /app/email-server /opt/email/email-server
COPY --from=builder /app/spam.txt /opt/email/spam.txt
COPY --from=builder /app/domain-blacklist.txt /opt/email/domain-blacklist.txt
COPY --from=builder /app/cert-gen.sh /opt/email/cert-gen.sh

RUN mkdir -p /opt/email/emails && \
	mkdir -p /opt/email/keys && \
	chmod +x /opt/email/cert-gen.sh

EXPOSE 10025 10465 10587

# create a user and group - app-user
RUN addgroup -S app-group && adduser -S app-user -G app-group

RUN mkdir -p /opt/email/tls && \
	chown -R app-user:app-group /opt/email && \
	chmod 755 /opt/email/emails && \
	chmod 777 /opt/email/keys && \
	chmod 777 /opt/email/tls

VOLUME [ "/opt/email/tls" ]

USER app-user

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -zv localhost 25 || exit 1

CMD [ "/opt/email/email-server"]

