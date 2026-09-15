# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q
from django.utils import timezone

from plane.db.models.base import BaseModel


def get_default_org_unit_sort_order():
    return 65535


class OrgUnit(BaseModel):
    """Research organisation tree node.

    The tree is materialised with a ``path`` column that stores the slash
    delimited primary keys of the node ancestry (including the node itself),
    which keeps descendant lookups a single indexed ``startswith`` query.
    """

    class UnitType(models.TextChoices):
        ROOT = "ROOT", "Root"
        INSTITUTE = "INSTITUTE", "Institute"
        LAB = "LAB", "Lab"
        GROUP = "GROUP", "Group"
        TEAM = "TEAM", "Team"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="research_org_units",
    )
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        related_name="children",
        null=True,
        blank=True,
    )
    path = models.CharField(max_length=1024, default="", db_index=True)
    depth = models.PositiveSmallIntegerField(default=0)
    unit_type = models.CharField(max_length=20, choices=UnitType.choices, default=UnitType.GROUP)
    sort_order = models.FloatField(default=get_default_org_unit_sort_order)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Research Org Unit"
        verbose_name_plural = "Research Org Units"
        db_table = "research_org_units"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "parent", "name"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_orgu_uq_parent_name",
            ),
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(parent__isnull=True, deleted_at__isnull=True),
                name="rsch_orgu_uq_root_name",
            ),
            models.UniqueConstraint(
                fields=["workspace"],
                condition=Q(unit_type="ROOT", parent__isnull=True, deleted_at__isnull=True),
                name="rsch_orgu_uq_single_root",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "path"], name="rsch_orgu_ws_path_idx"),
            models.Index(fields=["workspace", "parent", "sort_order"], name="rsch_orgu_ws_parent_idx"),
            models.Index(fields=["workspace", "unit_type"], name="rsch_orgu_ws_type_idx"),
        ]

    def __str__(self):
        return f"{self.workspace_id} <{self.name}>"

    @property
    def is_root(self):
        return self.parent_id is None

    def soft_delete(self, *args, **kwargs):
        """Soft delete without dispatching the async cascade task.

        Children are intentionally left untouched: ``is_active`` marks the
        node as retired while history (reports, audit events) keeps pointing
        at it.
        """
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_active", "deleted_at"])


class OrgUnitMember(BaseModel):
    """Membership and organisation role of a user inside an org unit."""

    class OrgRole(models.TextChoices):
        OWNER = "OWNER", "Owner"
        PI = "PI", "Principal Investigator"
        ADVISOR = "ADVISOR", "Advisor"
        REVIEWER = "REVIEWER", "Reviewer"
        UNIT_ADMIN = "UNIT_ADMIN", "Unit Admin"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="research_org_members",
    )
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_org_memberships",
    )
    org_role = models.CharField(max_length=20, choices=OrgRole.choices, default=OrgRole.PI)
    is_primary = models.BooleanField(default=False)
    effective_from = models.DateField(default=timezone.localdate)
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Research Org Unit Member"
        verbose_name_plural = "Research Org Unit Members"
        db_table = "research_org_unit_members"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["org_unit", "user", "org_role"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_orgm_uq_unit_user_role",
            ),
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=Q(is_primary=True, deleted_at__isnull=True),
                name="rsch_orgm_uq_primary",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "org_role"], name="rsch_orgm_user_role_idx"),
            models.Index(fields=["org_unit", "org_role"], name="rsch_orgm_unit_role_idx"),
            models.Index(fields=["workspace", "user"], name="rsch_orgm_ws_user_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} <{self.org_role}>"

    def is_effective(self, on_date=None):
        on_date = on_date or timezone.localdate()
        if self.effective_from and self.effective_from > on_date:
            return False
        if self.effective_to and self.effective_to < on_date:
            return False
        return True


class MentorBinding(BaseModel):
    """Direct (per-mentee) advisor relationship for a research owner."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="research_mentor_bindings",
    )
    mentee = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_mentor_bindings",
    )
    mentor = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_mentee_bindings",
    )
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.SET_NULL,
        related_name="mentor_bindings",
        null=True,
        blank=True,
    )
    effective_from = models.DateField(default=timezone.localdate)
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Research Mentor Binding"
        verbose_name_plural = "Research Mentor Bindings"
        db_table = "research_mentor_bindings"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "mentee", "mentor"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_mtr_uq_pair",
            ),
            models.CheckConstraint(
                condition=~Q(mentee=models.F("mentor")),
                name="rsch_mtr_no_self",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "mentee"], name="rsch_mtr_mentee_idx"),
            models.Index(fields=["workspace", "mentor"], name="rsch_mtr_mentor_idx"),
        ]

    def __str__(self):
        return f"{self.mentee_id} <- {self.mentor_id}"

    def is_effective(self, on_date=None):
        on_date = on_date or timezone.localdate()
        if self.effective_from and self.effective_from > on_date:
            return False
        if self.effective_to and self.effective_to < on_date:
            return False
        return True
