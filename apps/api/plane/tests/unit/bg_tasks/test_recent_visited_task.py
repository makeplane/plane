# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``recent_visited_task`` must write the audit fields in a single INSERT.

It used to create the row and then ``save(update_fields=[...])`` again; if a
concurrent task evicted the row in between, that raised "Save with update_fields
did not affect any rows".
"""

from unittest import mock
from uuid import uuid4

import pytest

from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.db.models import UserRecentVisit


@pytest.mark.unit
@pytest.mark.django_db
def test_new_visit_sets_audit_fields_without_second_save(workspace, create_user):
    with mock.patch.object(UserRecentVisit, "save", autospec=True, side_effect=UserRecentVisit.save) as save:
        recent_visited_task("issue", uuid4(), create_user.id, None, workspace.slug)

    visit = UserRecentVisit.objects.get(user=create_user)
    assert visit.created_by_id == create_user.id
    assert visit.updated_by_id == create_user.id
    assert save.call_count == 1
