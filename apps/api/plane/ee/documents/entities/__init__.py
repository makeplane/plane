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
]
