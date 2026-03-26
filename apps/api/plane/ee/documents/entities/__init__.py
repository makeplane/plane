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

"""
Entity OpenSearch documents.

This module contains OpenSearch document definitions for specific entities:
- Issue and IssueComment documents (with semantic search support)
- Project, Workspace, Module, Cycle documents
- Page document (with semantic search support)
- IssueView and Teamspace documents

Each document type corresponds to a Django model and defines field mappings,
index settings, and data preparation methods.
"""

from .issue import IssueDocument, IssueCommentDocument
from .project import ProjectDocument
from .workspace import WorkspaceDocument
from .module import ModuleDocument
from .cycle import CycleDocument
from .page import PageDocument
from .issue_view import IssueViewDocument
from .teamspace import TeamspaceDocument
from .plane_docs import PLANE_DOCS_INDEX_NAME, PLANE_DOCS_INDEX_BODY

__all__ = [
    # Issue-related documents
    "IssueDocument",
    "IssueCommentDocument",
    # Core entity documents
    "ProjectDocument",
    "WorkspaceDocument",
    "ModuleDocument",
    "CycleDocument",
    "PageDocument",
    "IssueViewDocument",
    "TeamspaceDocument",
    # Documentation index constants (no Django model — managed via direct OS client)
    "PLANE_DOCS_INDEX_NAME",
    "PLANE_DOCS_INDEX_BODY",
]


