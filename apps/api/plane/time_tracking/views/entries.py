# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.db.models import BooleanField, ExpressionWrapper, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..constants import TIME_ENTRIES_MAX_PER_PAGE, TIME_ENTRIES_PER_PAGE
from ..filters import exclude_running, filter_entries, ordering_for
from ..models import TimeEntry
from ..serializers import BulkSerializer, TimeEntryCreateSerializer, TimeEntryUpdateSerializer, validated
from ..services import bulk_update, create_manual_entry, delete_entry, update_entry
from .base import ENTRY_RELATIONS, TimeTrackingBaseView, not_found, parse_bool_param

RUNNING = ExpressionWrapper(Q(started_at__isnull=False, ended_at__isnull=True), output_field=BooleanField())


class TimeEntryListCreateEndpoint(TimeTrackingBaseView):
    def get(self, request, slug):
        access = self.get_access(request, slug)
        entries = filter_entries(request.GET, access.visible_entries())
        if not parse_bool_param(request.GET, "include_running", True):
            entries = exclude_running(entries)
        # running entries are pinned to the top whatever the sort order
        entries = (
            entries.annotate(_running=RUNNING)
            .order_by("-_running", *ordering_for(request.GET.get("order_by")))
            .select_related(*ENTRY_RELATIONS)
        )
        return self.paginate(
            request=request,
            queryset=entries,
            on_results=lambda rows: self.serialize(rows, access, many=True),
            default_per_page=TIME_ENTRIES_PER_PAGE,
            max_per_page=TIME_ENTRIES_MAX_PER_PAGE,
        )

    def post(self, request, slug):
        access = self.get_access(request, slug)
        data = validated(TimeEntryCreateSerializer, request.data)
        entry = create_manual_entry(access, request.user, data)
        entry = TimeEntry.objects.select_related(*ENTRY_RELATIONS).get(pk=entry.pk)
        return Response(self.serialize(entry, access), status=status.HTTP_201_CREATED)


class TimeEntryDetailEndpoint(TimeTrackingBaseView):
    def get_entry(self, access, pk, lock=False):
        entries = access.visible_entries().filter(pk=pk).select_related(*ENTRY_RELATIONS, "user")
        if lock:
            entries = entries.select_for_update(of=("self",))
        entry = entries.first()
        if entry is None:
            raise not_found("Time entry not found.")
        return entry

    def get(self, request, slug, pk):
        access = self.get_access(request, slug)
        return Response(self.serialize(self.get_entry(access, pk), access), status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        access = self.get_access(request, slug)
        data = validated(TimeEntryUpdateSerializer, request.data)
        with transaction.atomic():
            entry = self.get_entry(access, pk, lock=True)
            update_entry(access, request.user, entry, data)
        entry = TimeEntry.objects.select_related(*ENTRY_RELATIONS).get(pk=pk)
        return Response(self.serialize(entry, access), status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        access = self.get_access(request, slug)
        with transaction.atomic():
            entry = self.get_entry(access, pk, lock=True)
            delete_entry(access, request.user, entry)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TimeEntryBulkEndpoint(TimeTrackingBaseView):
    def post(self, request, slug):
        access = self.get_access(request, slug)
        data = validated(BulkSerializer, request.data)
        updated = bulk_update(access, request.user, data["action"], data["ids"], data.get("is_billable"))
        return Response({"updated": updated}, status=status.HTTP_200_OK)
