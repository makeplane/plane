#!/usr/bin/env python3
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""End-to-end checks for the hybrid deployment. Standard library only.

Read-only checks are safe against production:

    smoke.py --public-url https://operations.example.com

--write also creates a user, workspace, project, work item and attachment, so run
it only on a test stack or on production before launch. It needs sign-ups enabled.

--connect-url sends requests to a different address than the public one, which is
how the local test stack reaches the router.
"""

import argparse
import base64
import http.client
import json
import os
import socket
import ssl
import sys
import urllib.parse
import uuid

failures = []


def check(name, passed, detail=""):
    print(f"{'PASS' if passed else 'FAIL'}  {name}" + (f"  ({detail})" if detail and not passed else ""))
    if not passed:
        failures.append(name)
    return passed


class Client:
    """Keeps cookies by hand: the jar in the standard library drops Secure cookies
    when the test stack connects over plain http."""

    def __init__(self, public_url, connect_url):
        self.public = urllib.parse.urlsplit(public_url)
        self.connect = urllib.parse.urlsplit(connect_url)
        self.cookies = {}

    def _connection(self, target):
        if target.scheme == "https":
            return http.client.HTTPSConnection(target.netloc, timeout=60)
        return http.client.HTTPConnection(target.netloc, timeout=60)

    def request(self, method, path, body=None, headers=None):
        conn = self._connection(self.connect)
        all_headers = {
            "Host": self.public.netloc,
            "Origin": f"{self.public.scheme}://{self.public.netloc}",
            "X-Real-IP": "203.0.113.10",
            "User-Agent": "nexus-hybrid-smoke",
        }
        if self.cookies:
            all_headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        all_headers.update(headers or {})
        conn.request(method, path, body=body, headers=all_headers)
        response = conn.getresponse()
        data = response.read()
        conn.close()
        for key, value in response.getheaders():
            if key.lower() == "set-cookie":
                name, _, rest = value.partition("=")
                self.cookies[name.strip()] = rest.split(";", 1)[0]
        return response, data

    def json(self, method, path, payload=None):
        body = json.dumps(payload) if payload is not None else None
        response, data = self.request(method, path, body, {"Content-Type": "application/json"})
        try:
            return response, json.loads(data) if data else None
        except ValueError:
            return response, None

    def form(self, path, fields):
        return self.request(
            "POST",
            path,
            urllib.parse.urlencode(fields),
            {"Content-Type": "application/x-www-form-urlencoded"},
        )


def read_only_checks(client):
    response, data = client.request("GET", "/")
    check("web: / serves the app", response.status == 200 and b"<html" in data.lower(), str(response.status))

    response, _ = client.request("GET", "/some/deep/link")
    check("web: deep links fall back to the app", response.status == 200, str(response.status))

    response, data = client.json("GET", "/api/instances/")
    check("api: /api/instances/ responds", response.status == 200 and isinstance(data, dict), str(response.status))

    response, data = client.request("GET", "/auth/get-csrf-token/")
    check("auth: /auth/ reaches Django", response.status == 200 and b"csrf_token" in data, str(response.status))

    for path, label in (("/god-mode", "admin"), ("/spaces", "space")):
        response, _ = client.request("GET", path)
        check(f"{label}: {path} redirects to {path}/", response.status in (301, 308), str(response.status))
        response, _ = client.request("GET", f"{path}/")
        check(f"{label}: {path}/ responds", response.status == 200, str(response.status))

    response, _ = client.request("GET", "/live/health")
    check("live: /live/health responds", response.status == 200, str(response.status))

    # A request without a token must be refused by the MCP server itself: a 401 with
    # a Bearer challenge, not the gateway's 404 or the web bundle.
    response, _ = client.request(
        "POST",
        "/mcp",
        b"{}",
        {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"},
    )
    check(
        "mcp: /mcp reaches the MCP server and requires a token",
        response.status == 401 and response.getheader("WWW-Authenticate", "").startswith("Bearer"),
        str(response.status),
    )

    # An anonymous listing of the bucket must be refused by MinIO itself, which also
    # proves /uploads reaches MinIO and not the web bundle.
    response, data = client.request("GET", "/uploads/")
    check("uploads: bucket refuses anonymous listing", response.status == 403 and b"AccessDenied" in data, str(response.status))

    response, data = client.request("GET", "/__gateway/health")
    check("router: gateway health endpoint is not public", data != b"ok", str(response.status))

    websocket_check(client)


def websocket_check(client):
    target = client.connect
    secure = target.scheme == "https"
    port = target.port or (443 if secure else 80)
    sock = socket.create_connection((target.hostname, port), timeout=30)
    if secure:
        context = ssl.create_default_context()
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        sock = context.wrap_socket(sock, server_hostname=target.hostname)
    key = base64.b64encode(os.urandom(16)).decode()
    sock.sendall(
        (
            "GET /live/collaboration HTTP/1.1\r\n"
            f"Host: {client.public.netloc}\r\n"
            f"Origin: {client.public.scheme}://{client.public.netloc}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        ).encode()
    )
    status_line = sock.recv(1024).split(b"\r\n", 1)[0].decode(errors="replace")
    sock.close()
    check("live: WebSocket upgrade passes the whole chain", " 101 " in status_line, status_line)


def ensure_instance_admin(client, suffix, password):
    """A new Plane instance refuses all sign-ups until its first admin exists."""
    _, data = client.json("GET", "/api/instances/")
    if data["instance"]["is_setup_done"]:
        return
    _, data = client.request("GET", "/auth/get-csrf-token/")
    response, _ = client.form(
        "/api/instances/admins/sign-up/",
        {
            "csrfmiddlewaretoken": json.loads(data)["csrf_token"],
            "email": f"smoke-admin-{suffix}@example.com",
            "first_name": "Smoke",
            "last_name": "Admin",
            "company_name": "Smoke",
            "password": password,
            "is_telemetry_enabled": "False",
        },
    )
    location = response.getheader("Location", "")
    check("admin: first instance admin created", response.status == 302 and "error_code" not in location, f"{response.status} {location}")
    # Later requests in this run belong to the regular user, not this admin.
    client.cookies.clear()


def write_checks(client):
    suffix = uuid.uuid4().hex[:10]
    email = f"smoke-{suffix}@example.com"
    password = f"Smoke-{uuid.uuid4().hex}!"

    ensure_instance_admin(client, suffix, password)

    _, data = client.request("GET", "/auth/get-csrf-token/")
    csrf = json.loads(data)["csrf_token"]
    response, _ = client.form(
        "/auth/sign-up/",
        {"csrfmiddlewaretoken": csrf, "email": email, "password": password},
    )
    location = response.getheader("Location", "")
    public_origin = f"{client.public.scheme}://{client.public.netloc}"
    check("auth: sign-up redirects to the public origin", location.startswith(public_origin), location)
    check("auth: no sign-up error returned", "error_code" not in location, location)
    check("auth: session cookie issued", "session-id" in client.cookies, str(list(client.cookies)))

    response, me = client.json("GET", "/api/users/me/")
    if not check("auth: session is accepted", response.status == 200 and me and me.get("email") == email, str(response.status)):
        return

    # Stock Plane v1.4.3 accepted these; the fork rejects them.
    response, _ = client.request(
        "POST",
        "/api/workspaces/",
        json.dumps({"name": f"Origin {suffix}", "slug": f"origin-{suffix}", "organization_size": "Just myself"}),
        {"Content-Type": "application/json", "Origin": "https://evil.example.com"},
    )
    check("auth: writes from another origin are rejected", response.status == 403, str(response.status))

    slug = f"smoke-{suffix}"
    response, workspace = client.json(
        "POST", "/api/workspaces/", {"name": f"Smoke {suffix}", "slug": slug, "organization_size": "Just myself"}
    )
    if not check("workspace: created", response.status == 201, str(response.status)):
        return

    response, project = client.json(
        "POST",
        f"/api/workspaces/{slug}/projects/",
        {"name": "Smoke", "identifier": "SMK", "network": 2, "description": ""},
    )
    if not check("project: created", response.status == 201, str(response.status)):
        return
    project_id = project["id"]

    response, issue = client.json(
        "POST",
        f"/api/workspaces/{slug}/projects/{project_id}/issues/",
        {"name": "Smoke test work item", "priority": "none"},
    )
    if not check("work item: created", response.status == 201, str(response.status)):
        return
    response, _ = client.json(
        "PATCH",
        f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue['id']}/",
        {"name": "Smoke test work item (updated)"},
    )
    check("work item: updated", response.status == 204 or response.status == 200, str(response.status))

    upload_round_trip(client, slug, workspace["id"], public_origin)

    response, _ = client.request("GET", "/api/users/me/", headers={"X-Real-IP": "203.0.113.11"})
    check("auth: session survives another client address", response.status == 200, str(response.status))

    _, data = client.request("GET", "/auth/get-csrf-token/")
    response, _ = client.form("/auth/sign-out/", {"csrfmiddlewaretoken": json.loads(data)["csrf_token"]})
    check("auth: sign-out redirects", response.status == 302, str(response.status))
    response, _ = client.json("GET", "/api/users/me/")
    check("auth: session ended after sign-out", response.status in (401, 403), str(response.status))


def upload_round_trip(client, slug, workspace_id, public_origin):
    content = f"hybrid smoke {uuid.uuid4()}".encode() + bytes(range(256))
    response, asset = client.json(
        "POST",
        f"/api/assets/v2/workspaces/{slug}/",
        {
            "name": "smoke.png",
            "type": "image/png",
            "size": len(content),
            "entity_type": "WORKSPACE_LOGO",
            "entity_identifier": workspace_id,
        },
    )
    if not check("uploads: signed URL issued", response.status == 200, f"{response.status} {asset}"):
        return

    upload = asset["upload_data"]
    url = upload["url"]
    check("uploads: signed URL uses the public https origin", url.startswith(f"{public_origin}/uploads"), url)

    boundary = uuid.uuid4().hex
    parts = []
    for key, value in upload["fields"].items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="smoke.png"\r\n'
        f"Content-Type: image/png\r\n\r\n".encode()
        + content
        + f"\r\n--{boundary}--\r\n".encode()
    )
    response, data = client.request(
        "POST",
        urllib.parse.urlsplit(url).path,
        b"".join(parts),
        {"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    if not check("uploads: file accepted by MinIO", response.status in (200, 201, 204), f"{response.status} {data[:300]!r}"):
        return

    response, _ = client.json(
        "PATCH",
        f"/api/assets/v2/workspaces/{slug}/{asset['asset_id']}/",
        {"attributes": {"name": "smoke.png", "type": "image/png", "size": len(content)}},
    )
    check("uploads: asset marked uploaded", response.status == 204, str(response.status))

    response, _ = client.request("GET", f"/api/assets/v2/workspaces/{slug}/{asset['asset_id']}/")
    location = response.getheader("Location", "")
    if not check("uploads: download redirects to a signed public URL", response.status == 302 and location.startswith(public_origin), f"{response.status} {location}"):
        return
    parsed = urllib.parse.urlsplit(location)
    response, data = client.request("GET", f"{parsed.path}?{parsed.query}")
    check("uploads: signed URL returns the same bytes", response.status == 200 and data == content, f"{response.status} {len(data)} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-url", required=True)
    parser.add_argument("--connect-url")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    client = Client(args.public_url.rstrip("/"), (args.connect_url or args.public_url).rstrip("/"))
    read_only_checks(client)
    if args.write:
        write_checks(client)

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
