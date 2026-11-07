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

--echo-agent-id, with --write, also chats with that agent through the agent bridge
and runner. It must be the echo test agent, which only a test stack enables.
"""

import argparse
import base64
import http.client
import json
import os
import socket
import ssl
import struct
import sys
import time
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
    agent_read_only_checks(client)


class WebSocket:
    """A minimal WebSocket client (RFC 6455): enough to drive the agent chat."""

    def __init__(self, sock, buffered):
        self.sock = sock
        self.buffer = buffered

    @classmethod
    def open(cls, client, path, origin=None, cookies=True):
        """Returns (status line, WebSocket or None). The socket is only kept on a 101."""
        target = client.connect
        secure = target.scheme == "https"
        port = target.port or (443 if secure else 80)
        sock = socket.create_connection((target.hostname, port), timeout=30)
        if secure:
            context = ssl.create_default_context()
            context.minimum_version = ssl.TLSVersion.TLSv1_2
            sock = context.wrap_socket(sock, server_hostname=target.hostname)
        key = base64.b64encode(os.urandom(16)).decode()
        lines = [
            f"GET {path} HTTP/1.1",
            f"Host: {client.public.netloc}",
            f"Origin: {origin or f'{client.public.scheme}://{client.public.netloc}'}",
            "X-Real-IP: 203.0.113.10",
            "Upgrade: websocket",
            "Connection: Upgrade",
            f"Sec-WebSocket-Key: {key}",
            "Sec-WebSocket-Version: 13",
        ]
        if cookies and client.cookies:
            lines.append("Cookie: " + "; ".join(f"{k}={v}" for k, v in client.cookies.items()))
        sock.sendall(("\r\n".join(lines) + "\r\n\r\n").encode())
        data = b""
        while b"\r\n\r\n" not in data:
            chunk = sock.recv(4096)
            if not chunk:
                break
            data += chunk
        head, _, rest = data.partition(b"\r\n\r\n")
        status_line = head.split(b"\r\n", 1)[0].decode(errors="replace")
        if " 101 " not in status_line:
            sock.close()
            return status_line, None
        return status_line, cls(sock, rest)

    def _read(self, size):
        while len(self.buffer) < size:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionError("connection closed")
            self.buffer += chunk
        data, self.buffer = self.buffer[:size], self.buffer[size:]
        return data

    def _send_frame(self, opcode, payload):
        header = bytes([0x80 | opcode])
        length = len(payload)
        if length < 126:
            header += bytes([0x80 | length])
        elif length < 65536:
            header += bytes([0x80 | 126]) + struct.pack("!H", length)
        else:
            header += bytes([0x80 | 127]) + struct.pack("!Q", length)
        mask = os.urandom(4)
        self.sock.sendall(header + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def send_json(self, message):
        self._send_frame(0x1, json.dumps(message).encode())

    def receive(self):
        """Returns ("text", str) or ("close", (code, reason)). Answers pings."""
        message = b""
        while True:
            first, second = self._read(2)
            opcode, length = first & 0x0F, second & 0x7F
            if length == 126:
                length = struct.unpack("!H", self._read(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self._read(8))[0]
            payload = self._read(length)
            if opcode == 0x9:
                self._send_frame(0xA, payload)
            elif opcode == 0x8:
                code = struct.unpack("!H", payload[:2])[0] if len(payload) >= 2 else 1005
                return "close", (code, payload[2:].decode(errors="replace"))
            elif opcode in (0x0, 0x1, 0x2):
                message += payload
                if first & 0x80:
                    return "text", message.decode()

    def close(self):
        try:
            self._send_frame(0x8, struct.pack("!H", 1000))
        except OSError:
            pass
        self.sock.close()


def websocket_check(client):
    status_line, ws = WebSocket.open(client, "/live/collaboration")
    if ws:
        ws.sock.close()
    check("live: WebSocket upgrade passes the whole chain", " 101 " in status_line, status_line)


def agent_read_only_checks(client):
    response, data = client.json("GET", "/agents/health")
    check("agents: /agents/health reaches the bridge", response.status == 200 and isinstance(data, dict), str(response.status))

    # The bridge calls the API's internal endpoints directly; the gateway hides them.
    response, _ = client.json("POST", "/api/internal/agent-sessions/", {})
    check("agents: /api/internal/ is not reachable from outside", response.status == 404, str(response.status))

    path = f"/agents/acp?agent={uuid.uuid4()}&workspace=smoke"
    status_line, ws = WebSocket.open(client, path, cookies=False)
    if not check("agents: chat WebSocket upgrade passes the whole chain", ws is not None, status_line):
        return
    try:
        kind, value = ws.receive()
    except (OSError, ConnectionError) as error:
        kind, value = "error", (0, str(error))
    ws.sock.close()
    check("agents: chat without a session cookie closes with 4401", kind == "close" and value[0] == 4401, f"{kind} {value}")


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


def write_checks(client, echo_agent_id=None):
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
    agent_write_checks(client, slug, echo_agent_id)

    response, _ = client.request("GET", "/api/users/me/", headers={"X-Real-IP": "203.0.113.11"})
    check("auth: session survives another client address", response.status == 200, str(response.status))

    _, data = client.request("GET", "/auth/get-csrf-token/")
    response, _ = client.form("/auth/sign-out/", {"csrfmiddlewaretoken": json.loads(data)["csrf_token"]})
    check("auth: sign-out redirects", response.status == 302, str(response.status))
    response, _ = client.json("GET", "/api/users/me/")
    check("auth: session ended after sign-out", response.status in (401, 403), str(response.status))


class AcpSession:
    """Drives one ACP connection as the browser does, answering permission prompts."""

    def __init__(self, ws):
        self.ws = ws
        self.next_id = 0
        self.updates = []
        self.permission_requests = []

    def request(self, method, params, timeout=60):
        self.next_id += 1
        request_id = self.next_id
        self.ws.send_json({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params})
        self.ws.sock.settimeout(timeout)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            kind, value = self.ws.receive()
            if kind == "close":
                raise ConnectionError(f"closed with {value[0]} {value[1]}")
            message = json.loads(value)
            if message.get("id") == request_id and "method" not in message:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message["result"]
            if message.get("method") == "session/update":
                self.updates.append(message["params"]["update"])
            elif message.get("method") == "session/request_permission":
                self.permission_requests.append(message["params"])
                allow = next(o for o in message["params"]["options"] if o["kind"] == "allow_once")
                answer = {"outcome": {"outcome": "selected", "optionId": allow["optionId"]}}
                self.ws.send_json({"jsonrpc": "2.0", "id": message["id"], "result": answer})
        raise TimeoutError(f"{method}: no answer in {timeout}s")

    def text(self, kind):
        return "".join(u["content"].get("text", "") for u in self.updates if u.get("sessionUpdate") == kind)


def agent_write_checks(client, slug, echo_agent_id):
    path = f"/agents/acp?agent={echo_agent_id or uuid.uuid4()}&workspace={slug}"

    # Cross-site WebSocket hijacking: a page on another site would send the user's cookie too.
    status_line, ws = WebSocket.open(client, path, origin="https://evil.example.com")
    if ws:
        ws.sock.close()
    check("agents: a signed-in chat from another origin is refused (403)", " 403 " in status_line, status_line)

    if not echo_agent_id:
        return

    response, agents = client.json("GET", f"/api/workspaces/{slug}/agents/")
    listed = response.status == 200 and any(a.get("id") == echo_agent_id for a in agents or [])
    check("agents: the workspace lists the registered agent", listed, f"{response.status} {agents}")

    status_line, ws = WebSocket.open(client, path)
    if not check("agents: signed-in chat WebSocket opens", ws is not None, status_line):
        return
    session = AcpSession(ws)
    try:
        capabilities = {"fs": {"readTextFile": False, "writeTextFile": False}, "terminal": False}
        init = session.request("initialize", {"protocolVersion": 1, "clientCapabilities": capabilities})
        check("agents: initialize", init.get("protocolVersion") == 1, str(init)[:300])

        new = session.request("session/new", {"cwd": "/", "mcpServers": []})
        session_id = new.get("sessionId")
        check("agents: session/new", bool(session_id), str(new)[:300])

        text = "hello from the smoke test"
        result = session.request("session/prompt", {"sessionId": session_id, "prompt": [{"type": "text", "text": text}]})
        echoed = session.text("agent_message_chunk")
        check(
            "agents: session/prompt echoes through the bridge and runner",
            result.get("stopReason") == "end_turn" and echoed == text,
            f"{result} {echoed!r}",
        )

        session.updates.clear()
        prompt = [{"type": "text", "text": "/tool execute smoke"}]
        result = session.request("session/prompt", {"sessionId": session_id, "prompt": prompt})
        answered = session.text("agent_message_chunk")
        check(
            "agents: a permission prompt reaches the browser and its answer reaches the agent",
            len(session.permission_requests) == 1 and answered == "allowed" and result.get("stopReason") == "end_turn",
            f"{result} {len(session.permission_requests)} {answered!r}",
        )
    except (OSError, ConnectionError, RuntimeError, TimeoutError, KeyError, StopIteration, ValueError) as error:
        check("agents: ACP conversation with the echo agent", False, repr(error))
    finally:
        ws.close()


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
    parser.add_argument("--echo-agent-id", help="id of a registered echo test agent (test stacks only)")
    args = parser.parse_args()

    client = Client(args.public_url.rstrip("/"), (args.connect_url or args.public_url).rstrip("/"))
    read_only_checks(client)
    if args.write:
        write_checks(client, args.echo_agent_id)

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
