# Mail stack for Gizmo

Postfix + Dovecot + Rspamd, deployed alongside Gizmo on the same host.
TLS certificates are issued by Gizmo's Caddy proxy and shared read-only
into Postfix/Dovecot via a named Docker volume. Mailboxes are read and
sent from Gizmo's own in-app mail client at `/mail` (no separate webmail
service is deployed).

Mailboxes, domains and aliases live in **plane-db** (tables `mailboxes`,
`mail_domains`, `mail_aliases`) and are managed from the god-mode panel
(**Почтовый сервер**). Postfix reads them via `pgsql:` maps and Dovecot
authenticates against the `mailboxes.password_hash` (SHA512-CRYPT). Changes
take effect immediately — no file edits or container restarts.

## Local mode (no public domain)

To set everything up before a public domain is provisioned (e.g. to create all
mailboxes and point a desktop client at the server), just start the stack
without `MAIL_DOMAIN`:

```bash
./setup.sh start all     # or menu option 4: "Start mail server only"
```

setup.sh defaults `MAIL_DOMAIN=mail.local`, sets `MAIL_LOCAL=true`, and the
Postfix/Dovecot entrypoints generate a self-signed certificate so the stack
starts without Caddy/Let's Encrypt. Then:

- Manage mailboxes/aliases in god-mode → **Почтовый сервер**
  (`http://localhost/god-mode` → Почтовый сервер).
- Connect a mail client: IMAP `localhost:993`, SMTP `localhost:587` (STARTTLS),
  accept the self-signed certificate.
- Or read/send mail from Gizmo's own client at `http://localhost/mail`.

Sending mail to the public internet still requires a real domain, DNS, rDNS and
an open outbound port 25 — see the production steps below.

## Architecture

```
Internet
  ├──> 25/587/465  → Postfix → Rspamd milter → Dovecot LMTP → Maildir
  ├──> 143/993     → Dovecot (IMAP)
  └──> 80/443      → Gizmo Caddy
                       └─ mail.<MAIL_DOMAIN>    → stub (cert only)

Gizmo api/worker/beat-worker ──extra_hosts──> host-gateway:587 → Postfix
Gizmo web app (/mail) ──IMAP/SMTP──> Dovecot / Postfix
```

## Pre-requisites

1. DNS records (replace `<MAIL_DOMAIN>` with your apex, e.g. `example.com`):
   - `A    mail.<MAIL_DOMAIN>     SERVER_IP`
   - `MX   <MAIL_DOMAIN>          mail.<MAIL_DOMAIN>  priority 10`
   - `TXT  <MAIL_DOMAIN>          "v=spf1 mx -all"`
   - `TXT  _dmarc.<MAIL_DOMAIN>   "v=DMARC1; p=quarantine; rua=mailto:postmaster@<MAIL_DOMAIN>"`
   - DKIM TXT is added later (see step 6).
2. PTR / rDNS at your hosting provider: `SERVER_IP → mail.<MAIL_DOMAIN>`.
   Without this Gmail/Outlook will reject.
3. Outbound port 25 unblocked at the provider (Hetzner/OVH/AWS/GCE/Azure/DO
   block it by default). Open a ticket BEFORE deploying.
4. `sudo hostnamectl set-hostname mail.<MAIL_DOMAIN>` on the host.

## Deployment

All commands run from the repo root.

### 1. Configure MAIL_DOMAIN

```bash
# in the Gizmo root .env:
echo 'MAIL_DOMAIN=example.com' >> .env

# and in the mail-stack .env:
cp mail-stack/.env.example mail-stack/.env
# edit mail-stack/.env to set MAIL_DOMAIN=example.com
```

### 2. Recreate the Gizmo proxy so Caddy issues the cert for mail.<MAIL_DOMAIN>

```bash
docker compose up -d --force-recreate proxy api worker beat-worker
```

Wait ~30s, then verify:

```bash
docker exec proxy ls /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/mail.example.com/
# expect: mail.example.com.crt  mail.example.com.key  mail.example.com.json
```

If the directory is missing, check `docker logs proxy` for ACME errors —
the most common cause is the DNS A record not yet being live.

### 3. Bring up the mail stack

```bash
cd mail-stack
docker compose up -d
```

`postfix` and `dovecot` will fail to start if the cert directory above
doesn't exist yet — that's the signal to fix DNS first.

### 4. Create the noreply mailbox (used by Gizmo)

Mailboxes are managed from god-mode → **Почтовый сервер** (no file edits). Log in
as instance owner, open the page, and create `noreply@example.com` with a
password. The domain row is created automatically from the address. Repeat for
`admin@example.com` and any other mailboxes/aliases you need.

Changes are written to plane-db and picked up by Postfix/Dovecot immediately.

### 5. Generate DKIM key

```bash
docker exec -it rspamd rspamadm dkim_keygen \
    -s mail \
    -d example.com \
    -k /var/lib/rspamd/dkim.example.com.key
```

The command prints a `mail._domainkey.example.com TXT "v=DKIM1; ..."`
line — publish it as a DNS TXT record. Then:

```bash
dig +short TXT mail._domainkey.example.com
# wait until it returns the published value
docker compose restart rspamd
```

### 6. Configure Gizmo SMTP via god-mode UI

In Gizmo, log in as instance owner → `/god-mode` → Email, and enter:

| Field            | Value                  |
|------------------|------------------------|
| Host             | mail.example.com       |
| Port             | 587                    |
| Sender email     | noreply@example.com    |
| Security         | STARTTLS / TLS         |
| Authentication   | enabled                |
| Username         | noreply@example.com    |
| Password         | (mailbox password)     |

Press **Send test email** → it should arrive within a few seconds.

## Verification

```bash
# Cert chain served on :443 (Caddy)
openssl s_client -connect mail.example.com:443 -servername mail.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# Outbound port 25 reachable (run from a host outside your network)
nc -zv mail.example.com 25

# STARTTLS on 587
openssl s_client -starttls smtp -connect mail.example.com:587 -crlf </dev/null

# IMAPS on 993
openssl s_client -connect mail.example.com:993 </dev/null

# Postfix queue
docker exec postfix mailq

# Rspamd stats
docker exec rspamd rspamc stat

# End-to-end: send a Gizmo test email to a Gmail address, then in Gmail
# open "Show original" — confirm SPF=PASS, DKIM=PASS (d=example.com),
# DMARC=PASS.
```

## Backup

These paths are critical:

- `mail-stack/data/mail/` — all mailboxes (Maildir).
- `mail-stack/data/rspamd/dkim.*.key` — DKIM private keys. Loss requires
  generating a new key and updating the DNS TXT record.
- **plane-db** — mailbox/domain/alias definitions and password hashes now live
  in the `mailboxes`, `mail_domains`, `mail_aliases` tables (backed up together
  with the rest of Gizmo's Postgres data via `./setup.sh` backup).

## Notes / known landmines

- The TLS cert is issued by Caddy and lives in the named volume
  `plane_caddy-data`. The `cert-reloader` sidecar uses inotify on the
  cert directory and sends `SIGHUP` to Postfix + `doveadm reload` to
  Dovecot whenever Caddy renews. The watcher mounts the Docker socket;
  if that's unacceptable, replace it with a host cron job.
- Rspamd controller UI is on container port 11334, **not** published.
  Reach it via `ssh -L 11334:127.0.0.1:11334 <server>` after temporarily
  publishing the port, or front it with Caddy + basic auth.
- Gizmo API uses `extra_hosts: mail.<MAIL_DOMAIN>:host-gateway` so that
  outbound SMTP from Gizmo resolves to the host gateway IP and hits the
  published port 587 of Postfix directly, bypassing NAT hairpin. The TLS
  cert CN still matches `mail.<MAIL_DOMAIN>`, so validation succeeds.
- Gizmo Intake Email (turning incoming mail into work items) is NOT
  configured here — it requires routing inbound mail into Gizmo's API
  and is intentionally out of scope for this MVP.
