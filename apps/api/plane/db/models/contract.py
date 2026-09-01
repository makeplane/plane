# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): the contract half of
# the historical contract/delivery tracking spreadsheet this Plane deployment
# replaces. See docs/internal-contract-project-relationship.md for the design.
#
# Contract is a workspace-scoped master entity: one row per real contract number
# in the source spreadsheet's column F ("合同号"). ContractProject is the join
# table that records "this Contract is associated with this Plane Project" --
# the relationship is intentionally many-to-many, because a single contract can
# cover multiple projects (e.g. one procurement contract spanning a dozen
# project numbers) and a single project can also reference multiple contracts
# (e.g. a main contract plus one or more supplementary contracts).
#
# Plane's native Project model is deliberately left as the "business project"
# entity: every row of the historical spreadsheet still maps 1:1 to one Plane
# Project (so the existing project-info page, custom field engine, and member
# model keep working). ContractProject just records the link to the new
# Contract row that aggregates each project's contract-side fields (合同净额,
# 税率, 签约日期 etc.) which previously had to be repeated on every Project row.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel
from .project import ProjectBaseModel


class Contract(BaseModel):
    """
    Workspace-scoped contract master. One row per contract_no within a workspace.

    Inherits BaseModel (not WorkspaceBaseModel) on purpose: WorkspaceBaseModel
    carries an optional `project` FK whose semantics imply "this row belongs to
    a single project". Contract deliberately has no such field -- a contract
    belongs to a workspace, not to one of the projects it happens to cover. The
    project links live on ContractProject below.
    """

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="contracts"
    )
    # Source spreadsheet column F ("合同号"). max_length=64 covers the longest
    # observed value in the source data ("5763-5W19011"-class strings fit easily);
    # a per-workspace UniqueConstraint enforces "no two contracts share a number"
    # in the workspace, replacing the per-project uniqueness that the source
    # spreadsheet's "合同号&项目号" column attempted (and failed) to provide.
    contract_no = models.CharField(max_length=64)
    contract_name = models.CharField(max_length=255, blank=True)
    contract_type = models.CharField(max_length=64, blank=True)
    customer = models.CharField(max_length=255, blank=True)
    # Source spreadsheet column G ("签约登记日期").
    sign_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    # Source spreadsheet column H ("合同净额/不含第三方（人民币万元）") -- a contract
    # total lives here once, instead of being repeated on every associated
    # Project row as it was when this data lived in ProjectCustomFieldValue.
    total_amount = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    # Source spreadsheet column I ("税率（%）"). Storing as Decimal (not percent
    # string) at the same precision as the source column, matching the convention
    # used by other percent fields in this deployment (see historical_project_import
    # for the "is_percent" flag meaning).
    tax_rate = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    status = models.CharField(max_length=64, blank=True)

    class Meta:
        constraints = [
            # The new home for "no two contracts share the same number in one
            # workspace". Replaces the advisory-lock-protected per-project
            # uniqueness the source spreadsheet forced.
            models.UniqueConstraint(
                fields=["workspace", "contract_no"],
                condition=Q(deleted_at__isnull=True),
                name="contract_unique_workspace_contract_no_when_not_deleted",
            )
        ]
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
        db_table = "contracts"
        ordering = ("workspace_id", "contract_no")

    def __str__(self):
        return f"{self.contract_no} <{self.workspace.name}>"


class ContractProject(ProjectBaseModel):
    """
    Join row: Contract <-> Project (many-to-many).

    Inherits ProjectBaseModel (not BaseModel) because it carries a Project FK
    by definition -- the `workspace` field is auto-populated from the Project
    on save() (see ProjectBaseModel). The extra fields record what is
    contract-specific about THIS association (the per-relationship allocation
    share, the relation type, etc.), as opposed to contract-wide data which
    lives on the Contract row above.
    """

    contract = models.ForeignKey(
        "db.Contract", on_delete=models.CASCADE, related_name="project_links"
    )
    # Source spreadsheet column J ("合同占比（%）"). A given Contract's total_amount
    # is allocated across its associated projects via these per-row ratios.
    allocation_ratio = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    relation_type = models.CharField(max_length=64, blank=True)
    relation_role = models.CharField(max_length=32, blank=True)
    allocated_amount = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    scope_description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=64, blank=True)
    remark = models.TextField(blank=True)

    class Meta:
        constraints = [
            # One ContractProject per (Contract, Project) pair. Database-level
            # enforcement replaces the source spreadsheet's "this contract number
            # appears once per project, but the same contract number can repeat
            # across multiple projects if multiple rows share the same F-column
            # value" behaviour, which was exactly the bug this whole refactor
            # exists to fix.
            models.UniqueConstraint(
                fields=["contract", "project"],
                condition=Q(deleted_at__isnull=True),
                name="contract_project_unique_contract_project_when_not_deleted",
            )
        ]
        indexes = [
            # "All projects for this contract" is the primary lookup direction;
            # the UniqueConstraint above already provides an index for it. The
            # reverse direction -- "all contracts for this project", driven by
            # the project-info page's "关联合同" block (Phase B) -- needs this
            # explicit index because it isn't covered by the unique constraint.
            models.Index(fields=["project"]),
        ]
        verbose_name = "Contract Project"
        verbose_name_plural = "Contract Projects"
        db_table = "contract_projects"
        ordering = ("project_id", "contract_id")

    def __str__(self):
        return f"{self.contract.contract_no} <-> {self.project.name}"