# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests of plane-decision against a fake Plane API with recorded responses (standard library only, no network):

    python3 -m unittest liviere/tools/test_plane_decision.py

Every decision is invented (the sample file of the import: a tea shop, project DEMO).
"""

import contextlib
import importlib.machinery
import importlib.util
import io
import json
import os
import threading
import unittest
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("plane-decision")
SAMPLE = Path(__file__).parents[2] / "apps/api/plane/tests/contract/api/data/decisions_sample.json"
loader = importlib.machinery.SourceFileLoader("plane_decision", str(SCRIPT))
spec = importlib.util.spec_from_loader("plane_decision", loader)
plane_decision = importlib.util.module_from_spec(spec)
loader.exec_module(plane_decision)

PROJECT = {"id": "11111111-1111-1111-1111-111111111111", "identifier": "DEMO", "name": "Sklep", "timezone": "UTC"}
BASE = f"/api/v1/workspaces/sklep/projects/{PROJECT['id']}/liviere/decisions/"


def decision(number, title, **fields):
    return {
        "number": number,
        "identifier": f"DEMO-D{number}",
        "title": title,
        "rationale": None,
        "rejected": None,
        "area": "zamowienia",
        "mechanism": "zwroty",
        "area2": None,
        "kind": "product",
        "status": "active",
        "decided_by": "user",
        "confirmed": True,
        "decided_on": "2026-10-10",
        "review_on": None,
        "review_condition": None,
        "issues": [],
        "sources": [],
        "supersedes": None,
        "superseded_by": [],
        "related": [],
        "pending_rollout": False,
        "rollout": None,
        "needs_review": False,
        "estimated": [],
        "note": None,
        "queues": [],
        **fields,
    }


RETURNS = decision(2, "Zwrot przyjmujemy do 30 dni od dostawy", supersedes=1, related=[3, 7])
OLD = decision(1, "Zwrot przyjmujemy do 14 dni od dostawy", status="superseded", superseded_by=[2])
PARCELS = decision(
    3,
    "Paczki wychodzą raz dziennie, o 14:00",
    mechanism="wysylka",
    decided_by="unknown",
    queues=["confirm", "imported"],
)


class FakePlane(BaseHTTPRequestHandler):
    requests = []

    def log_message(self, *args):
        pass

    def _json(self, status, value):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle(self):
        url = urllib.parse.urlsplit(self.path)
        params = dict(urllib.parse.parse_qsl(url.query))
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length)) if length else None
        FakePlane.requests.append({"method": self.command, "path": url.path, "params": params, "body": body})
        if url.path.endswith("/workspaces/sklep/projects/"):
            return self._json(200, {"results": [PROJECT]})
        if not url.path.startswith(BASE):
            return self._json(404, {"error": "Not found"})
        return self.route(url.path[len(BASE) :], params, body)

    def route(self, path, params, body):
        method = self.command
        if path == "" and method == "GET":
            # Two pages: the tool has to follow the cursor
            if params.get("cursor") in (None, ""):
                return self._json(
                    200, {"results": [OLD, RETURNS], "next_page_results": True, "next_cursor": "1000:1:0"}
                )
            return self._json(200, {"results": [PARCELS], "next_page_results": False, "next_cursor": "1000:2:0"})
        if path in ("", "propose/") and method == "POST":
            status = "proposed" if path else "active"
            by = "agent" if body.get("by") != "user" else "user"
            return self._json(201, decision(9, body["title"], status=status, decided_by=by, area=body["area"]))
        if path == "2/" and method == "GET":
            history = [
                {
                    "occurred_at": "2026-11-27T10:00:00+00:00",
                    "kind": "imported",
                    "channel": "api",
                    "actor": {"display_name": "ai"},
                }
            ]
            return self._json(200, {**RETURNS, "history": history})
        if path == "search/":
            return self._json(200, {"total": 2, "limit": body["limit"], "has_more": False, "results": [RETURNS, OLD]})
        if path == "2/supersede/":
            new = [
                decision(10 + i, item["title"], supersedes=2) for i, item in enumerate(body.get("decisions") or [body])
            ]
            return self._json(
                201,
                {
                    "superseded": {**RETURNS, "status": "superseded", "superseded_by": [d["number"] for d in new]},
                    "created": new,
                },
            )
        if path == "inbox/":
            rollout = {"reason": "supersedes", "at": "2026-11-27T12:00:00+00:00", "by": None, "channel": "app"}
            return self._json(
                200,
                {
                    "results": [
                        decision(
                            10,
                            "Zwrot przyjmujemy do 60 dni od dostawy",
                            supersedes=2,
                            pending_rollout=True,
                            rollout=rollout,
                        )
                    ]
                },
            )
        if path.endswith("/ack/"):
            return self._json(200, decision(int(path.split("/")[0]), "x"))
        if path == "3/link/":
            return self._json(
                200, {**PARCELS, "issues": [{"identifier": i, "visible": False} for i in body.get("issues", [])]}
            )
        if path == "areas/" and method == "GET":
            return self._json(
                200,
                {
                    "results": [
                        {
                            "id": 1,
                            "key": "zamowienia",
                            "name": "Zamówienia",
                            "sort_order": 1,
                            "mechanisms": [{"id": 2, "key": "zwroty", "name": "Zwroty", "sort_order": 1}],
                        }
                    ]
                },
            )
        if path == "areas/" and method == "POST":
            return self._json(201, {"id": 5, "key": body["key"], "name": body["name"], "sort_order": 3})
        if path == "areas/2/" and method == "PATCH":
            return self._json(200, {"id": 2, "key": "zwroty", "name": body["name"], "sort_order": 1})
        if path == "import/":
            if body.get("format") != 2:
                return self._json(
                    400,
                    {
                        "error": "The file has errors; nothing was written",
                        "code": "import_rejected",
                        "dry_run": True,
                        "errors": [{"number": None, "field": "format", "error": "'format' must be 2"}],
                        "warnings": [],
                    },
                )
            numbers = [d["number"] for d in body["decisions"]]
            sources = {}
            for d in body["decisions"]:
                for source in d["sources"]:
                    sources.setdefault(source, []).append(d["number"])
            return self._json(
                201 if params.get("commit") else 200,
                {
                    "dry_run": not params.get("commit"),
                    "errors": [],
                    "warnings": [],
                    "summary": {
                        "decisions": len(numbers),
                        "by_status": {"active": 3, "superseded": 1},
                        "areas_created": 3,
                        "mechanisms_created": 3,
                        "needs_review": 2,
                        "issue_links": 2,
                        "issues_not_found": 0,
                    },
                    "sources": sources,
                    "last_number": max(numbers),
                },
            )
        return self._json(404, {"error": "Not found"})

    do_GET = do_POST = do_PATCH = _handle


class PlaneDecisionTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakePlane)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        FakePlane.requests = []
        environment = {
            "PLANE_API_KEY": "test-key",
            "PLANE_WORKSPACE_SLUG": "sklep",
            "PLANE_BASE_URL": f"http://127.0.0.1:{self.server.server_port}",
        }
        patcher = mock.patch.dict(os.environ, environment)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_tool(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = plane_decision.main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def calls(self, method=None):
        return [
            r for r in FakePlane.requests if r["path"].startswith(BASE) and (method is None or r["method"] == method)
        ]

    def test_decision_numbers(self):
        self.assertEqual([plane_decision.decision_number(v) for v in ("12", "D12", "demo-d12", "DEMO-D12")], [12] * 4)

    def test_add_sends_the_fields_and_the_owner_flag(self):
        code, out, _ = self.run_tool(
            "add",
            "-p",
            "demo",
            "--area",
            "zamowienia/zwroty",
            "--kind",
            "product",
            "--issue",
            "DEMO-3",
            "--source",
            "CLAUDE.md:41",
            "--related",
            "D3",
            "--by",
            "user",
            "--rollout",
            RETURNS["title"],
        )
        self.assertEqual(code, 0)
        (call,) = self.calls("POST")
        self.assertEqual(call["path"], BASE)
        self.assertEqual(
            call["body"],
            {
                "title": RETURNS["title"],
                "area": "zamowienia",
                "mechanism": "zwroty",
                "kind": "product",
                "issues": ["DEMO-3"],
                "sources": ["CLAUDE.md:41"],
                "related": [3],
                "by": "user",
                "rollout": True,
            },
        )
        self.assertIn("DEMO-D9", out)

    def test_propose_has_no_owner_flags(self):
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            plane_decision.main(
                ["propose", "-p", "DEMO", "--area", "zamowienia", "--kind", "operations", "--by", "user", "x"]
            )
        code, out, _ = self.run_tool(
            "propose", "-p", "DEMO", "--area", "zamowienia", "--kind", "operations", "Raport raz w tygodniu"
        )
        self.assertEqual((code, self.calls("POST")[0]["path"]), (0, BASE + "propose/"))
        self.assertIn("[proposed", out)

    def test_list_follows_every_page_and_brief_is_one_line(self):
        code, out, _ = self.run_tool("list", "-p", "DEMO", "--area", "zamowienia/zwroty", "--status", "all", "--brief")
        self.assertEqual(code, 0)
        pages = self.calls("GET")
        self.assertEqual([p["params"].get("cursor") for p in pages], [None, "1000:1:0"])
        self.assertEqual(
            pages[0]["params"], {"area": "zamowienia", "mechanism": "zwroty", "status": "all", "per_page": "1000"}
        )
        self.assertEqual(
            out.splitlines(),
            [
                "DEMO-D1  Zwrot przyjmujemy do 14 dni od dostawy",
                "DEMO-D2  Zwrot przyjmujemy do 30 dni od dostawy",
                "DEMO-D3  Paczki wychodzą raz dziennie, o 14:00",
            ],
        )

    def test_list_lines_show_state_successor_and_queues(self):
        _, out, _ = self.run_tool("list", "-p", "DEMO")
        lines = out.splitlines()
        self.assertTrue(lines[0].startswith("DEMO-D1   [superseded → DEMO-D2]  zamowienia/zwroty"))
        self.assertIn("[active, confirm, imported]  zamowienia/wysylka  Paczki", lines[2])

    def test_show_and_json(self):
        _, out, _ = self.run_tool("show", "-p", "DEMO", "DEMO-D2")
        self.assertIn("supersedes: DEMO-D1", out)
        self.assertIn("related:    DEMO-D3, DEMO-D7", out)
        self.assertIn("imported (ai, api)", out)
        # History times in the local time of the machine, not UTC
        utc = plane_decision.datetime.fromisoformat("2026-11-27T10:00:00+00:00")
        local = utc.astimezone().strftime("%Y-%m-%d %H:%M")
        self.assertIn(f"· {local}  imported", out)
        _, out, _ = self.run_tool("show", "-p", "DEMO", "2", "--json")
        self.assertEqual(json.loads(out)["number"], 2)

    def test_search_sends_the_phrase_in_the_body(self):
        _, out, err = self.run_tool("search", "-p", "DEMO", "--status", "all", "zwrot", "dni")
        (call,) = self.calls("POST")
        self.assertEqual(call["body"], {"q": "zwrot dni", "limit": 50, "status": "all"})
        self.assertEqual(call["params"], {})
        self.assertIn("[superseded → DEMO-D2]", out)
        self.assertIn("2 of 2", err)

    def test_supersede_one_or_split(self):
        _, out, _ = self.run_tool("supersede", "-p", "DEMO", "D2", "Zwrot do 60 dni", "--by", "user")
        self.assertEqual(self.calls("POST")[0]["body"], {"title": "Zwrot do 60 dni", "by": "user"})
        self.assertIn("superseded → DEMO-D10", out)
        FakePlane.requests = []
        self.run_tool("supersede", "-p", "DEMO", "2", "Zwrot do 60 dni", "Wysyłka raz dziennie")
        self.assertEqual(
            self.calls("POST")[0]["body"],
            {"decisions": [{"title": "Zwrot do 60 dni"}, {"title": "Wysyłka raz dziennie"}]},
        )

    def test_operations(self):
        self.run_tool("defer", "-p", "DEMO", "D2", "--when", "gdy wróci kurier")
        self.run_tool("revoke", "-p", "DEMO", "D2", "--reason", "nieaktualne")
        self.run_tool("accept", "-p", "DEMO", "D2", "--by", "user")
        self.run_tool("confirm", "-p", "DEMO", "D2")
        self.run_tool("done", "-p", "DEMO", "D2")
        self.assertEqual(
            [(c["path"][len(BASE) :], c["body"]) for c in self.calls("POST")],
            [
                ("2/defer/", {"review_condition": "gdy wróci kurier"}),
                ("2/revoke/", {"reason": "nieaktualne"}),
                ("2/accept/", {"by": "user"}),
                ("2/confirm/", {}),
                ("2/done/", {}),
            ],
        )

    def test_inbox_ack_and_link(self):
        _, out, _ = self.run_tool("inbox", "-p", "DEMO")
        self.assertEqual(
            out.splitlines(),
            [
                "DEMO-D10  changed, supersedes DEMO-D2 · 2026-11-27 · zamowienia/zwroty",
                "          „Zwrot przyjmujemy do 60 dni od dostawy”",
            ],
        )
        _, out, _ = self.run_tool("ack", "-p", "DEMO", "D10", "D11", "--issue", "DEMO-20")
        self.assertEqual(
            [(c["path"][len(BASE) :], c["body"]) for c in self.calls("POST")],
            [("10/ack/", {"issues": ["DEMO-20"]}), ("11/ack/", {"issues": ["DEMO-20"]})],
        )
        self.assertIn("DEMO-D10  rollout done (DEMO-20)", out)
        FakePlane.requests = []
        self.run_tool("link", "-p", "DEMO", "D3", "--issue", "DEMO-20", "--source", "zlecenie:2026-10-01/A")
        self.assertEqual(self.calls("POST")[0]["body"], {"issues": ["DEMO-20"], "sources": ["zlecenie:2026-10-01/A"]})

    def test_areas(self):
        _, out, _ = self.run_tool("areas", "-p", "DEMO")
        self.assertEqual(out.splitlines()[1].split(), ["zamowienia/zwroty", "Zwroty"])
        self.run_tool("areas", "add", "-p", "DEMO", "zamowienia/wysylka", "Wysyłka")
        self.assertEqual(self.calls("POST")[0]["body"], {"key": "wysylka", "name": "Wysyłka", "parent": "zamowienia"})
        self.run_tool("areas", "rename", "-p", "DEMO", "zamowienia/zwroty", "Zwroty i reklamacje")
        self.assertEqual(self.calls("PATCH")[0]["path"], BASE + "areas/2/")

    def test_import_is_a_dry_run_unless_commit(self):
        code, out, _ = self.run_tool("import", "-p", "DEMO", str(SAMPLE))
        self.assertEqual(code, 0)
        self.assertEqual(self.calls("POST")[0]["params"], {})
        self.assertIn("Dry run: nothing was written", out)
        self.assertIn("8 decisions", out)
        FakePlane.requests = []
        code, out, _ = self.run_tool("import", "-p", "DEMO", str(SAMPLE), "--commit")
        self.assertEqual((code, self.calls("POST")[0]["params"]), (0, {"commit": "1"}))
        self.assertIn("Imported. Next number: 9.", out)
        self.assertIn("  memory:project_returns_notes.md: D1, D2", out)

    def test_import_errors_are_listed(self):
        with self.subTest("bad file"):
            path = Path(self.id().replace(".", "_") + ".json")
            bad = Path(os.environ.get("TMPDIR", "/tmp")) / path.name
            bad.write_text(json.dumps({"format": 1, "decisions": []}), encoding="utf-8")
            self.addCleanup(bad.unlink)
            code, out, err = self.run_tool("import", "-p", "DEMO", str(bad), "--commit")
            self.assertEqual(code, 1)
            self.assertIn("error   format: 'format' must be 2", out)
            self.assertIn("Nothing was written.", out)
            self.assertIn("not imported", err)


if __name__ == "__main__":
    unittest.main()
