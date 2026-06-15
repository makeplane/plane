# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Server-side execution of filters and the out-of-office auto-reply.

Filter rules (``MailFilterRule``) and forwarding/vacation settings
(``MailForwarding``) are stored in the database and edited from the web UI, but
the actual processing happens at delivery time inside Dovecot. We compile the
mailbox configuration into a single Sieve script and upload it over ManageSieve
(authenticating as the Dovecot master user, exactly like the IMAP path) so it
runs for every incoming message via the LMTP ``sieve`` plugin.
"""

from plane.mail.conf import get_mail_config
from plane.mail.exceptions import MailConfigurationError, MailError
from plane.mail.labels import label_keyword

SIEVE_SCRIPT_NAME = "gizmo"

# special-use folder -> Dovecot mailbox name (see mail-stack/dovecot.conf.tmpl)
_FOLDER_NAMES = {
    "inbox": "INBOX",
    "archive": "Archive",
    "spam": "Junk",
    "trash": "Trash",
}

_FIELD_HEADERS = {
    "from": "from",
    "to": "to",
    "subject": "subject",
}


def _quote(value):
    text = "" if value is None else str(value)
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"').replace("\r", "").replace("\n", " ") + '"'


def _condition_test(condition):
    field = (condition.get("field") or "from").lower()
    value = condition.get("value")
    if not value:
        return None
    if field == "body":
        return f"body :text :contains {_quote(value)}"
    header = _FIELD_HEADERS.get(field, "from")
    return f"header :contains {_quote(header)} {_quote(value)}"


def _rule_block(rule, mailbox_labels):
    tests = [test for test in (_condition_test(c) for c in (rule.conditions or [])) if test]
    if not tests:
        return None, set()

    requires = set()
    if any((c.get("field") or "").lower() == "body" for c in (rule.conditions or [])):
        requires.add("body")

    if len(tests) == 1:
        condition = tests[0]
    else:
        joiner = "allof" if (rule.match_type or "all") == "all" else "anyof"
        condition = f"{joiner}({', '.join(tests)})"

    flag_lines = []
    destination = None  # None => keep in INBOX
    terminal = False

    for action in rule.actions or []:
        action_type = (action.get("type") or "").lower()
        if action_type == "label":
            keyword = mailbox_labels.get(str(action.get("value")))
            if keyword:
                flag_lines.append(f'addflag {_quote(keyword)};')
                requires.add("imap4flags")
        elif action_type == "mark_read":
            flag_lines.append('addflag "\\\\Seen";')
            requires.add("imap4flags")
        elif action_type == "star":
            flag_lines.append('addflag "\\\\Flagged";')
            requires.add("imap4flags")
        elif action_type == "mark_important":
            flag_lines.append('addflag "$Important";')
            requires.add("imap4flags")
        elif action_type == "skip_inbox":
            destination = destination or "Archive"
        elif action_type == "move_spam":
            destination = "Junk"

    body_lines = list(flag_lines)
    if destination:
        body_lines.append(f"fileinto {_quote(destination)};")
        requires.add("fileinto")
        terminal = True
    else:
        # keep so addflag-ed keywords are applied even when staying in INBOX
        body_lines.append("keep;")
    if terminal:
        body_lines.append("stop;")

    indented = "\n".join(f"  {line}" for line in body_lines)
    return f"if {condition} {{\n{indented}\n}}", requires


def build_sieve_script(mailbox):
    """Compile a mailbox's filters + forwarding/vacation into a Sieve script."""
    labels = {
        str(label.id): label_keyword(label)
        for label in mailbox.labels.filter(deleted_at__isnull=True)
    }

    requires = set()
    blocks = []

    forwarding = getattr(mailbox, "forwarding", None)
    if forwarding and forwarding.deleted_at is None:
        if forwarding.vacation_enabled and (forwarding.vacation_message or forwarding.vacation_subject):
            requires.add("vacation")
            params = [":days 1"]
            if forwarding.vacation_subject:
                params.append(f":subject {_quote(forwarding.vacation_subject)}")
            vacation = f"vacation {' '.join(params)} {_quote(forwarding.vacation_message or ' ')};"
            if forwarding.vacation_start and forwarding.vacation_end:
                requires.update({"date", "relational"})
                start = forwarding.vacation_start.date().isoformat()
                end = forwarding.vacation_end.date().isoformat()
                blocks.append(
                    f'if allof(currentdate :value "ge" "date" {_quote(start)}, '
                    f'currentdate :value "le" "date" {_quote(end)}) {{\n  {vacation}\n}}'
                )
            else:
                blocks.append(vacation)

        addresses = [addr for addr in (forwarding.forward_to or []) if addr]
        if forwarding.forward_enabled and addresses:
            requires.add("copy")
            for address in addresses:
                if forwarding.keep_copy:
                    blocks.append(f"redirect :copy {_quote(address)};")
                else:
                    blocks.append(f"redirect {_quote(address)};")

    rules = mailbox.filter_rules.filter(is_active=True, deleted_at__isnull=True).order_by("order", "name")
    for rule in rules:
        block, rule_requires = _rule_block(rule, labels)
        if block:
            blocks.append(block)
            requires.update(rule_requires)

    lines = []
    if requires:
        ordered = ", ".join(_quote(name) for name in sorted(requires))
        lines.append(f"require [{ordered}];")
        lines.append("")
    lines.append("# Generated by Gizmo Mail. Do not edit by hand.")
    lines.extend(blocks)
    return "\n".join(lines).strip() + "\n"


def sync_sieve(mailbox):
    """Upload and activate the mailbox's Sieve script over ManageSieve.

    No-ops silently when ManageSieve is not configured (e.g. master password
    unset). Raises ``MailError`` on an actual upload failure.

    Authenticates as the Dovecot master user using the same combined login form
    as the IMAP path (``<mailbox>*<master>``) over STARTTLS + SASL PLAIN.
    """
    import ssl

    config = get_mail_config()
    if not config.master_password or not config.sieve_host:
        return False

    script = build_sieve_script(mailbox)

    try:
        from sievelib.managesieve import Client
    except ImportError as error:  # pragma: no cover - dependency guard
        raise MailConfigurationError("sievelib is not installed.") from error

    client = Client(config.sieve_host, config.sieve_port)
    login = f"{mailbox.email}{config.master_separator}{config.master_user}"

    # In local mode Dovecot serves a self-signed certificate. sievelib builds its
    # STARTTLS context with ssl.create_default_context (which verifies), so when
    # certificate verification is disabled (same flag as IMAP) we relax it for
    # the duration of the connect.
    original_default_context = ssl.create_default_context
    if config.sieve_starttls and not config.imap_verify_ssl:
        ssl.create_default_context = lambda *args, **kwargs: ssl._create_unverified_context()
    try:
        connected = client.connect(
            login,
            config.master_password,
            starttls=config.sieve_starttls,
            authmech="PLAIN",
        )
    finally:
        ssl.create_default_context = original_default_context

    if not connected:
        raise MailError("Unable to authenticate to the ManageSieve service.")
    try:
        if not client.putscript(SIEVE_SCRIPT_NAME, script):
            raise MailError("Unable to upload the Sieve script.")
        client.setactive(SIEVE_SCRIPT_NAME)
    finally:
        client.logout()
    return True
