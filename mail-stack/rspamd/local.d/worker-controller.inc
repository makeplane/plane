# Web UI / API password for the rspamd controller worker.
#
# Generate a hash:
#   docker exec -it rspamd rspamadm pw
# Then paste the $2$... output below and uncomment the line.
#
# password = "$2$...";

# Do NOT publish port 11334 to the public internet. Reach the UI via
# ssh -L 11334:rspamd:11334 <server> or via Caddy + basic auth.
bind_socket = "*:11334";
