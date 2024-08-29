FROM --platform=$BUILDPLATFORM tonistiigi/binfmt as binfmt

FROM goreleaser/goreleaser:v2.2.0 as Build
WORKDIR /app

RUN apk add build-base

ARG PRIVATE_KEY
ENV PRIVATE_KEY=$PRIVATE_KEY

COPY . .

RUN goreleaser build --snapshot --clean --single-target --output=./prime-monitor

FROM alpine:latest as Run
WORKDIR /app
COPY --from=Build /app/prime-monitor /usr/local/bin/prime-monitor

CMD [ "prime-monitor", "start" ]

