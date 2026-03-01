# GraphQL Module

GraphQL API endpoint for the Plane mobile application.

## Purpose

Modern GraphQL API built with Strawberry framework, providing type-safe queries and mutations for mobile clients.

## Authentication

- JWT-based authentication
- Public operations whitelist: VersionCheckQuery, InstanceQuery, PublicWorkspaceInviteMutation

## Schema Overview

**Queries** (30+ types):

- Instance, FeatureFlag, VersionCheck
- User, Profile, UserFavorites
- Workspace, WorkspaceMembers, WorkspaceFeatures
- Project, ProjectMembers, ProjectFeatures
- Issues, IssueLinks, IssueAttachments, SubIssues
- Cycles, Modules, Pages, Epics, Intake
- Notifications, GlobalSearch

**Mutations** (27+ types):

- Device, Asset management
- User, Profile operations
- Workspace, Project management
- Issue CRUD, comments, attachments
- Cycle, Module operations
- Page, Epic operations
- Intake management

## Key Features

- Async/await architecture for non-blocking operations
- Feature flagging for enterprise features
- Strawberry-Django integration with Django ORM
- Comprehensive pagination and filtering
- Real-time notification support

## Code Statistics

- Total: ~33,000 lines
- Queries: ~7,178 lines
- 34+ type definition directories
