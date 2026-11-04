# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models.signals import pre_delete
from django.dispatch import receiver

from plane.db.models import Issue, IssueActivity, IssueComment


@receiver(pre_delete, sender=Issue)
def delete_issue_activity_on_hard_delete(sender, instance, using, **kwargs):
    """Remove history only when its work item is permanently deleted.

    The DO_NOTHING relation preserves history during soft deletion. Django sends
    pre_delete inside the collector's transaction, including for cascaded work
    items. Lock the parent before cleanup to serialize new activity references.
    """
    Issue.all_objects.using(using).select_for_update().filter(pk=instance.pk).exists()
    IssueActivity.all_objects.using(using).filter(issue_id=instance.pk).delete()


@receiver(pre_delete, sender=IssueComment)
def detach_comment_activity_on_hard_delete(sender, instance, using, **kwargs):
    """Keep work-item history when a comment (or a thread reply) is purged."""
    IssueComment.all_objects.using(using).select_for_update().filter(pk=instance.pk).exists()
    IssueActivity.all_objects.using(using).filter(issue_comment_id=instance.pk).update(issue_comment=None)
