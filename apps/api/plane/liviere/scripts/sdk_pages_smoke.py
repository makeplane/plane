#!/usr/bin/env python3
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Compatibility check of the project pages API against plane-sdk 0.3.1 (used by
plane-mcp-server 0.3.3). Runs outside Django, against a running instance:

    pip install plane-sdk==0.3.1
    PLANE_BASE_URL=http://localhost:8090 PLANE_API_KEY=... PLANE_WORKSPACE_SLUG=... \
    PLANE_PROJECT_ID=... python sdk_pages_smoke.py

Sequence: list -> create -> retrieve -> update -> [editor check] -> archive ->
unarchive -> archive -> delete -> retrieve (expects 404).

Then, for a page that was opened in the editor (needs the editor check): create ->
open in the editor -> update content and name -> open again (new content and title,
no duplicates) -> wait SMOKE_SETTLE_SECONDS (default 30) -> name and content still new.

The editor check is optional: if SMOKE_EDITOR_CHECK is set, it is run as a shell
command with PAGE_ID, EXPECTED_TEXT and EXPECTED_TITLE in the environment and must
exit with 0 (for example a headless browser that opens the page and reads the editor).
Never put keys in this file; everything comes from the environment.
"""

import os
import subprocess
import sys
import time
import uuid

from plane import PlaneClient
from plane.errors.errors import HttpError
from plane.models.pages import CreatePage, UpdatePage
from plane.models.query_params import PaginatedQueryParams


def step(name, func):
    try:
        result = func()
    except HttpError as e:
        print(f"FAIL {name}: HTTP {e.status_code} {e.response}")
        sys.exit(1)
    print(f"OK   {name}")
    return result


def main():
    client = PlaneClient(base_url=os.environ["PLANE_BASE_URL"], api_key=os.environ["PLANE_API_KEY"])
    slug = os.environ["PLANE_WORKSPACE_SLUG"]
    project_id = os.environ["PLANE_PROJECT_ID"]
    pages = client.pages
    marker = uuid.uuid4().hex[:8]

    listed = step(
        "list",
        lambda: pages.list_project_pages(slug, project_id, params=PaginatedQueryParams(per_page=20)),
    )
    print(f"     total_count={listed.total_count} results={len(listed.results)}")

    created = step(
        "create",
        lambda: pages.create_project_page(
            slug,
            project_id,
            data=CreatePage(name=f"SDK smoke {marker}", description_html=f"<p>Created by SDK {marker}</p>"),
        ),
    )
    page_id = created.id
    print(f"     id={page_id} owned_by={created.owned_by} projects={created.projects}")

    retrieved = step("retrieve", lambda: pages.retrieve_project_page(slug, project_id, page_id))
    assert retrieved.description_html == f"<p>Created by SDK {marker}</p>", retrieved.description_html

    new_text = f"Updated by SDK {marker}"
    updated = step(
        "update (PUT)",
        lambda: pages.update_project_page(
            slug,
            project_id,
            page_id,
            data=UpdatePage(name=f"SDK smoke {marker} (updated)", description_html=f"<p>{new_text}</p>"),
        ),
    )
    assert updated.description_html == f"<p>{new_text}</p>", updated.description_html

    if editor_check(page_id, new_text):
        print("OK   editor shows the content written through the API")

    step("archive", lambda: pages.archive_project_page(slug, project_id, page_id))
    archived = pages.retrieve_project_page(slug, project_id, page_id)
    assert archived.archived_at, "archived_at not set after archive"
    step("unarchive", lambda: pages.unarchive_project_page(slug, project_id, page_id))
    assert pages.retrieve_project_page(slug, project_id, page_id).archived_at is None
    step("archive again", lambda: pages.archive_project_page(slug, project_id, page_id))
    step("delete", lambda: pages.delete_project_page(slug, project_id, page_id))

    try:
        pages.retrieve_project_page(slug, project_id, page_id)
    except HttpError as e:
        if e.status_code in (403, 404):
            print(f"OK   retrieve after delete -> HTTP {e.status_code}")
        else:
            raise
    else:
        print("FAIL page still retrievable after delete")
        sys.exit(1)

    opened_page(pages, slug, project_id, marker)


def editor_check(page_id, text, title=None):
    """Runs SMOKE_EDITOR_CHECK; returns False when it is not configured, exits on failure."""
    command = os.environ.get("SMOKE_EDITOR_CHECK")
    if not command:
        print("SKIP editor check (SMOKE_EDITOR_CHECK not set)")
        return False
    env = {**os.environ, "PAGE_ID": str(page_id), "EXPECTED_TEXT": text, "EXPECTED_TITLE": title or ""}
    result = subprocess.run(command, shell=True, env=env)
    if result.returncode != 0:
        print(f"FAIL editor check (exit {result.returncode})")
        sys.exit(1)
    return True


def opened_page(pages, slug, project_id, marker):
    """A page that was opened in the editor: content and title change as a Yjs edit through live."""
    first_text = f"Opened page {marker}"
    page = step(
        "create (opened page)",
        lambda: pages.create_project_page(
            slug, project_id, data=CreatePage(name=f"Opened {marker}", description_html=f"<p>{first_text}</p>")
        ),
    )
    if not editor_check(page.id, first_text, f"Opened {marker}"):
        print("SKIP opened page scenario (needs the editor check)")
        return
    print("OK   page opened in the editor (it now has a Yjs document)")

    new_text, new_name = f"Changed after opening {marker}", f"Renamed {marker}"
    updated = step(
        "update content and name of the opened page (PUT)",
        lambda: pages.update_project_page(
            slug, project_id, page.id, data=UpdatePage(name=new_name, description_html=f"<p>{new_text}</p>")
        ),
    )
    assert updated.name == new_name and new_text in updated.description_html, updated
    editor_check(page.id, new_text, new_name)
    print("OK   editor shows the new content and title")

    settle = int(os.environ.get("SMOKE_SETTLE_SECONDS", "30"))
    time.sleep(settle)
    stored = pages.retrieve_project_page(slug, project_id, page.id)
    if stored.name != new_name or new_text not in stored.description_html:
        print(f"FAIL after {settle} s: name={stored.name!r} html={stored.description_html!r}")
        sys.exit(1)
    if stored.description_html.count(new_text) != 1 or first_text in stored.description_html:
        print(f"FAIL duplicated or stale content: {stored.description_html!r}")
        sys.exit(1)
    print(f"OK   after {settle} s the stored name and content are still the new ones")

    step("archive (opened page)", lambda: pages.archive_project_page(slug, project_id, page.id))
    step("delete (opened page)", lambda: pages.delete_project_page(slug, project_id, page.id))


if __name__ == "__main__":
    main()
