#!/bin/sh
# Joins the tailnet, then starts Caddy. If either process stops, the container exits
# so Railway restarts it, because a router without the tunnel would answer every
# backend request with a 502 while still looking healthy.
set -eu

: "${TS_AUTHKEY:?set TS_AUTHKEY to a Tailscale OAuth client secret or auth key}"
: "${TS_TAGS:?set TS_TAGS to the tag the key allows, such as tag:nexus-router}"
: "${ORIGIN_ADDR:?set ORIGIN_ADDR to the VPS tailnet address and port}"
: "${WEB_UPSTREAM:?set WEB_UPSTREAM to the private address of the web service}"

socket=/tmp/tailscaled.sock

# Full-size tailnet packets (1280 bytes) from Railway to the VPS were silently
# dropped: small requests worked, but anything over about 1 KB hung in both
# directions. A lower MTU makes each TCP connection negotiate smaller segments.
export TS_DEBUG_MTU="${TS_DEBUG_MTU:-1200}"

tailscaled \
  --tun=userspace-networking \
  --state=mem: \
  --socket="$socket" \
  --socks5-server=127.0.0.1:1055 &
tailscaled_pid=$!

caddy_pid=""
stop() {
  [ -z "$caddy_pid" ] || kill "$caddy_pid" 2>/dev/null || true
  kill "$tailscaled_pid" 2>/dev/null || true
}
trap 'stop; exit 0' TERM INT

# In-memory state and an ephemeral key mean each deploy registers a new node, and
# Tailscale removes the old one automatically.
tailscale --socket="$socket" up \
  --auth-key="$TS_AUTHKEY" \
  --advertise-tags="$TS_TAGS" \
  --hostname="${TS_HOSTNAME:-nexus-railway-router}" \
  --timeout=60s

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid=$!

while kill -0 "$tailscaled_pid" 2>/dev/null && kill -0 "$caddy_pid" 2>/dev/null; do
  sleep 5 &
  wait $! || true
done

echo "tailscaled or caddy stopped; exiting so the platform restarts this container." >&2
stop
exit 1
