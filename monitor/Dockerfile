FROM --platform=$BUILDPLATFORM tonistiigi/binfmt as binfmt

FROM golang:alpine3.20 as Build
WORKDIR /app

RUN apk update && \
	apk add git && \
	go install github.com/goreleaser/goreleaser/v2@latest

RUN apk add build-base

ARG PRIVATE_KEY
ENV PRIVATE_KEY=$PRIVATE_KEY

COPY . .

RUN goreleaser build --snapshot --clean --single-target --output=./prime-monitor

FROM alpine:latest as Run
WORKDIR /app
COPY --from=Build /app/prime-monitor /usr/local/bin/prime-monitor

CMD [ "prime-monitor", "start" ]

