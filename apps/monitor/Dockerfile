FROM --platform=$BUILDPLATFORM tonistiigi/binfmt AS binfmt

FROM goreleaser/goreleaser:v2.2.0 AS build
WORKDIR /app

RUN apk add build-base

ARG PRIVATE_KEY
ENV PRIVATE_KEY=$PRIVATE_KEY

COPY . .

RUN goreleaser build --snapshot --clean --single-target --output=./prime-monitor

FROM alpine:latest AS run
WORKDIR /app
COPY --from=build /app/prime-monitor /usr/local/bin/prime-monitor

CMD [ "prime-monitor", "start" ]

