# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.db import connection
from collections import defaultdict


def get_all_related_issues(issue_id):
    query = """
    WITH RECURSIVE Descendants AS (
        -- Base case: Start with the given parent issue
        SELECT id, parent_id
        FROM issues
        WHERE parent_id = %s AND deleted_at IS NULL AND archived_at IS NULL

        UNION ALL

        -- Recursive case: Find children of each issue
        SELECT i.id, i.parent_id
        FROM issues i
        INNER JOIN Descendants d ON i.parent_id = d.id WHERE i.deleted_at IS NULL AND i.archived_at IS NULL
    )
    SELECT id
    FROM Descendants;
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [issue_id])
        result = cursor.fetchall()

    # Extract IDs from the result
    descendant_ids = [row[0] for row in result]

    # Return as a queryset
    return descendant_ids


def get_all_related_issues_for_epics(epic_ids):
    query = """
    WITH RECURSIVE Descendants AS (
        SELECT id, parent_id, id AS root_epic_id
        FROM issues
        WHERE id = ANY(%s) AND deleted_at IS NULL AND archived_at IS NULL

        UNION ALL

        SELECT i.id, i.parent_id, d.root_epic_id
        FROM issues i
        JOIN Descendants d ON i.parent_id = d.id WHERE i.deleted_at IS NULL AND i.archived_at IS NULL
    )
    SELECT root_epic_id, id
    FROM Descendants
    WHERE id != root_epic_id;
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [epic_ids])
        rows = cursor.fetchall()

    # Create a dictionary mapping epic ID to related issue IDs
    epic_to_issues = defaultdict(list)
    for epic_id, issue_id in rows:
        epic_to_issues[epic_id].append(issue_id)

    return epic_to_issues
