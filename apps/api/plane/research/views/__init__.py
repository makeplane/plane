# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .audit import ResearchAuditEventListEndpoint
from .health import ResearchHealthEndpoint
from .settings import ResearchSettingsEndpoint
from .templates import (
    ResearchReportTemplateDetailEndpoint,
    ResearchReportTemplateListCreateEndpoint,
)
from .identity import (
    ResearchIdentityMappingDetailEndpoint,
    ResearchIdentityMappingListCreateEndpoint,
    ResearchIdentityMeEndpoint,
)
from .org import (
    ResearchMentorBindingDetailEndpoint,
    ResearchMentorBindingListCreateEndpoint,
    ResearchOrgUnitDetailEndpoint,
    ResearchOrgUnitListCreateEndpoint,
    ResearchOrgUnitMemberDetailEndpoint,
    ResearchOrgUnitMemberListCreateEndpoint,
    ResearchOrgUnitPiTransferEndpoint,
)
from .projects import (
    ResearchProjectArchiveEndpoint,
    ResearchProjectDetailEndpoint,
    ResearchProjectListCreateEndpoint,
    ResearchProjectRestoreEndpoint,
)
from .reports import (
    ResearchReportAcceptEndpoint,
    ResearchReportAccessEndpoint,
    ResearchReportDetailEndpoint,
    ResearchReportHistoryEndpoint,
    ResearchReportListCreateEndpoint,
    ResearchReportReturnEndpoint,
    ResearchReportSubmitEndpoint,
)

__all__ = [
    "ResearchHealthEndpoint",
    "ResearchSettingsEndpoint",
    "ResearchAuditEventListEndpoint",
    "ResearchReportTemplateDetailEndpoint",
    "ResearchReportTemplateListCreateEndpoint",
    "ResearchIdentityMappingDetailEndpoint",
    "ResearchIdentityMappingListCreateEndpoint",
    "ResearchIdentityMeEndpoint",
    "ResearchMentorBindingDetailEndpoint",
    "ResearchMentorBindingListCreateEndpoint",
    "ResearchOrgUnitDetailEndpoint",
    "ResearchOrgUnitListCreateEndpoint",
    "ResearchOrgUnitMemberDetailEndpoint",
    "ResearchOrgUnitMemberListCreateEndpoint",
    "ResearchOrgUnitPiTransferEndpoint",
    "ResearchProjectArchiveEndpoint",
    "ResearchProjectDetailEndpoint",
    "ResearchProjectListCreateEndpoint",
    "ResearchProjectRestoreEndpoint",
    "ResearchReportAcceptEndpoint",
    "ResearchReportAccessEndpoint",
    "ResearchReportDetailEndpoint",
    "ResearchReportHistoryEndpoint",
    "ResearchReportListCreateEndpoint",
    "ResearchReportReturnEndpoint",
    "ResearchReportSubmitEndpoint",
]
