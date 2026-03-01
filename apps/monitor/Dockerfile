FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

FROM golang:1.25.4-alpine3.22 AS build
WORKDIR /app

RUN apk update && \
	apk upgrade && \
	apk add git build-base && \
	go install github.com/goreleaser/goreleaser/v2@v2.13.0

ARG PRIVATE_KEY
ENV PRIVATE_KEY=$PRIVATE_KEY

COPY . .

RUN goreleaser build --snapshot --clean --single-target --output=./prime-monitor

FROM alpine:latest AS run
WORKDIR /app

RUN apk add --no-cache su-exec && \
	addgroup -g 1000 plane && adduser -u 1000 -G plane -s /bin/sh -D plane

COPY --from=build /app/prime-monitor /usr/local/bin/prime-monitor
COPY bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN chown -R plane:plane /app

CMD [ "/usr/local/bin/docker-entrypoint.sh" ]
