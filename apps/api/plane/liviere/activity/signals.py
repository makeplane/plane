# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Records actions on pages, cycles, modules and views. BaseModel.save takes the acting user from crum
# (the current request), so a save without a request user (background tasks) is not an action of anyone
# and is skipped. Connected in plane/liviere/apps.py.

# Third party imports
from crum import get_current_user

# Django imports
from django.db.models.signals import post_save, pre_save
from django.utils import timezone

# Module imports
from plane.db.models import Cycle, IssueView, Module, Page, ProjectPage
from plane.liviere.activity.kinds import (
    CYCLE_CHANGED,
    MODULE_CHANGED,
    PAGE_ARCHIVE,
    PAGE_CREATED,
    PAGE_EDITED,
    PAGE_RENAMED,
    VIEW_CHANGED,
)
from plane.liviere.activity.record import record_page_event
from plane.utils.exception_logger import log_exception

PAGE_TRACKED_FIELDS = ("name", "description_html", "archived_at", "deleted_at")


def current_actor_id():
    user = get_current_user()
    if user is None or user.is_anonymous:
        return None
    return user.id


def remember_page_state(sender, instance, **kwargs):
    if instance._state.adding or current_actor_id() is None:
        return
    update_fields = kwargs.get("update_fields")
    if update_fields is not None and not set(update_fields) & set(PAGE_TRACKED_FIELDS):
        return
    instance._liviere_previous = Page.all_objects.filter(pk=instance.pk).values(*PAGE_TRACKED_FIELDS).first()


def record_page_change(sender, instance, created, **kwargs):
    previous = getattr(instance, "_liviere_previous", None)
    instance._liviere_previous = None
    actor_id = current_actor_id()
    if created or previous is None or actor_id is None:
        return
    try:
        kinds = []
        if previous["deleted_at"] is None and instance.deleted_at is not None:
            kinds.append(PAGE_ARCHIVE)
        else:
            if previous["name"] != instance.name:
                kinds.append(PAGE_RENAMED)
            if previous["description_html"] != instance.description_html:
                kinds.append(PAGE_EDITED)
            if previous["archived_at"] != instance.archived_at:
                kinds.append(PAGE_ARCHIVE)
        for kind in kinds:
            record_page_event(instance.pk, kind, actor_id)
    except Exception as e:  # never break the request because of the heatmap
        log_exception(e)


def record_page_created(sender, instance, created, **kwargs):
    actor_id = current_actor_id()
    if not created or actor_id is None:
        return
    try:
        record_page_event(instance.page_id, PAGE_CREATED, actor_id, project_ids=[instance.project_id])
    except Exception as e:
        log_exception(e)


def project_object_recorder(kind, source):
    def record(sender, instance, created, **kwargs):
        actor_id = current_actor_id()
        if actor_id is None or not instance.project_id:
            return
        try:
            from plane.liviere.models import ActivityEvent

            ActivityEvent.objects.create(
                workspace_id=instance.workspace_id,
                project_id=instance.project_id,
                actor_id=actor_id,
                occurred_at=timezone.now(),
                kind=kind,
                source=source,
                object_id=instance.pk,
            )
        except Exception as e:
            log_exception(e)

    return record


record_cycle_change = project_object_recorder(CYCLE_CHANGED, "cycle")
record_module_change = project_object_recorder(MODULE_CHANGED, "module")
record_view_change = project_object_recorder(VIEW_CHANGED, "view")


def connect():
    uid = "liviere-activity"
    pre_save.connect(remember_page_state, sender=Page, dispatch_uid=f"{uid}-page-pre")
    post_save.connect(record_page_change, sender=Page, dispatch_uid=f"{uid}-page")
    post_save.connect(record_page_created, sender=ProjectPage, dispatch_uid=f"{uid}-project-page")
    post_save.connect(record_cycle_change, sender=Cycle, dispatch_uid=f"{uid}-cycle")
    post_save.connect(record_module_change, sender=Module, dispatch_uid=f"{uid}-module")
    post_save.connect(record_view_change, sender=IssueView, dispatch_uid=f"{uid}-view")
