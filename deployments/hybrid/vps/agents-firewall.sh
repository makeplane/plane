#!/usr/bin/env bash
# Keeps the agents off everything but the public internet. Agents in agent-runner run
# arbitrary shell commands, and the `agents` Docker network has outbound internet,
# which would otherwise also reach:
#   - other devices on the tailnet, as this VPS (Docker masquerades out tailscale0);
#   - the cloud provider's metadata service and private networks;
#   - this host itself (ufw allows SSH from anywhere).
# Traffic between containers on the `agents` network (agent-bridge <-> agent-runner,
# agent-runner -> mcp) is unaffected.
#
# Docker never flushes DOCKER-USER, so these rules survive container restarts.
# bootstrap.sh installs a systemd unit that re-applies them whenever Docker starts.
# Safe to run again. Run as root.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }

here="$(cd "$(dirname "$0")" && pwd)"
env_file="${ENV_FILE:-$here/.env}"
bridge="${AGENTS_BRIDGE_NAME:-}"
if [ -z "$bridge" ] && [ -r "$env_file" ]; then
  bridge="$(sed -n 's/^AGENTS_BRIDGE_NAME=//p' "$env_file" | tail -n 1)"
fi
bridge="${bridge:-br-nexus-agents}"

forward_chain=NEXUS-AGENTS-FWD
input_chain=NEXUS-AGENTS-IN

# Docker creates DOCKER-USER on start; create it too, so the order does not matter.
iptables -N DOCKER-USER 2>/dev/null || true
iptables -N "$forward_chain" 2>/dev/null || iptables -F "$forward_chain"
iptables -N "$input_chain" 2>/dev/null || iptables -F "$input_chain"

# Leaving the agents network, towards anything that is not the public internet.
iptables -A "$forward_chain" -o "$bridge" -j RETURN
iptables -A "$forward_chain" -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
# Docker's embedded DNS forwards queries to the host's resolvers, which can sit on a
# private or link-local address.
iptables -A "$forward_chain" -p udp --dport 53 -j RETURN
iptables -A "$forward_chain" -p tcp --dport 53 -j RETURN
iptables -A "$forward_chain" -o tailscale+ -j REJECT --reject-with icmp-admin-prohibited
for range in 0.0.0.0/8 10.0.0.0/8 100.64.0.0/10 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12 \
  192.0.0.0/24 192.168.0.0/16 198.18.0.0/15 224.0.0.0/4 240.0.0.0/4; do
  iptables -A "$forward_chain" -d "$range" -j REJECT --reject-with icmp-admin-prohibited
done
iptables -A "$forward_chain" -j RETURN

# To the host itself: nothing an agent needs.
iptables -A "$input_chain" -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
iptables -A "$input_chain" -j REJECT --reject-with icmp-admin-prohibited

iptables -C DOCKER-USER -i "$bridge" -j "$forward_chain" 2>/dev/null \
  || iptables -I DOCKER-USER 1 -i "$bridge" -j "$forward_chain"
iptables -C INPUT -i "$bridge" -j "$input_chain" 2>/dev/null \
  || iptables -I INPUT 1 -i "$bridge" -j "$input_chain"

echo "Agent network firewall applied to $bridge."
