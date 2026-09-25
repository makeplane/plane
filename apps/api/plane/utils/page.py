# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import connection

# The page tree is walked with a recursive CTE. Plane nests sub-pages only a
# handful of levels deep in practice, so 100 is far above any real hierarchy
# while bounding the walk: a parent cycle (A -> B -> A) would otherwise recurse
# forever under UNION ALL and hang the request. Legacy rows can carry such a
# cycle because the page endpoints historically accepted any parent id.
MAX_PAGE_TREE_DEPTH = 100


def unarchive_archive_page_and_descendants(page_id: str, archived_at, actor_id=None) -> None:
    """Archive or restore a page and all of its descendant pages.

    Pass a date to archive the subtree, or ``None`` to restore it. ``actor_id`` is
    the user performing the change, recorded as ``updated_by``.

    The traversal stays inside the root page's workspace, so a page parented to
    another tenant's page can never drag that subtree into this update, and it is
    depth-bounded by :data:`MAX_PAGE_TREE_DEPTH` so a pre-existing parent cycle
    cannot spin forever.

    ``updated_at``/``updated_by`` are maintained explicitly: this is a raw SQL
    UPDATE, so Django's ``auto_now`` never fires, and without it an archived page
    would keep a stale "last modified" — including in the ``page`` webhook payload
    that reports the archive to external subscribers.
    """
    sql = """
    WITH RECURSIVE descendants AS (
        SELECT id, workspace_id, 1 AS depth FROM pages WHERE id = %s
        UNION ALL
        SELECT pages.id, pages.workspace_id, descendants.depth + 1
        FROM pages, descendants
        WHERE pages.parent_id = descendants.id
            AND pages.workspace_id = descendants.workspace_id
            AND descendants.depth < %s
    )
    UPDATE pages
    SET archived_at = %s,
        updated_at = NOW(),
        updated_by_id = COALESCE(%s, updated_by_id)
    WHERE id IN (SELECT id FROM descendants);
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, [page_id, MAX_PAGE_TREE_DEPTH, archived_at, actor_id])
