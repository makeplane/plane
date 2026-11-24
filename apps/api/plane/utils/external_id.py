# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.


def external_pair_taken(queryset, instance, data):
    """Whether an update would give ``instance`` another row's external pair.

    The pair is the ``external_id`` and ``external_source`` the row has after the
    update: each comes from ``data`` when it is sent, else from ``instance``.
    Only rows of ``queryset`` other than ``instance`` count. Nothing is checked
    when the update touches neither field, keeps the row's own pair, or leaves
    the row without an external id.
    """
    if "external_id" not in data and "external_source" not in data:
        return False
    external_id = data.get("external_id", instance.external_id)
    if not external_id:
        return False
    external_source = data.get("external_source", instance.external_source)
    # Keeping the row's own pair is never a new conflict, even where duplicates
    # already exist, so an importer re-sending a row's pair keeps working.
    if (str(external_id), external_source) == (instance.external_id, instance.external_source):
        return False
    return (
        queryset.filter(external_id=str(external_id), external_source=external_source).exclude(pk=instance.pk).exists()
    )
