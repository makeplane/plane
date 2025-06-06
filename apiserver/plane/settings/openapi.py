"""
OpenAPI/Swagger configuration for drf-spectacular.

This file contains the complete configuration for API documentation generation.
"""

SPECTACULAR_SETTINGS = {
    # ========================================================================
    # Basic API Information
    # ========================================================================
    "TITLE": "The Plane REST API",
    "DESCRIPTION": (
        "The Plane REST API\n\n"
        "Visit our quick start guide and full API documentation at "
        "[developers.plane.so](https://developers.plane.so/api-reference/introduction)."
    ),
    "VERSION": "0.0.1",
    # ========================================================================
    # Schema Generation Settings
    # ========================================================================
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1/",
    "SCHEMA_CACHE_TIMEOUT": 0,  # disables caching
    # ========================================================================
    # Processing Hooks
    # ========================================================================
    "PREPROCESSING_HOOKS": [
        "plane.utils.openapi.hooks.preprocess_filter_api_v1_paths",
    ],
    # ========================================================================
    # Server Configuration
    # ========================================================================
    "SERVERS": [
        {"url": "http://localhost:8000", "description": "API v1"},
        {"url": "https://api.plane.so", "description": "API v1"},
    ],
    # ========================================================================
    # API Tag Definitions
    # ========================================================================
    "TAGS": [
        # Core Project Management
        {
            "name": "Projects",
            "description": (
                "**Project Management & Organization**\n\n"
                "Create, manage, and configure software development projects. These endpoints handle the core project lifecycle including "
                "setup, configuration, team management, and project-level settings. Essential for organizing work into distinct "
                "development initiatives with proper access controls and collaboration features.\n\n"
                "*Core Capabilities:*\n"
                "- Project creation, updates, and deletion (CRUD operations)\n"
                "- Project configuration and settings management\n"
                "- Team collaboration and workspace organization\n"
                "- Project visibility and access control\n"
                "- Project templates and initialization\n\n"
                "*Common Use Cases:* Setting up new development projects, configuring project workflows, "
                "managing project teams, organizing project hierarchies."
            ),
        },
        # Work Item Management
        {
            "name": "Work Items",
            "description": (
                "**Work Item Lifecycle Management**\n\n"
                "Manage issues, tasks, bugs, user stories, and other work items throughout their complete lifecycle. "
                "These are the primary entities that represent work to be done in software development projects. "
                "Supports agile workflows, task tracking, bug reporting, and feature development processes.\n\n"
                "*Core Capabilities:*\n"
                "- Create, read, update, delete work items (full CRUD)\n"
                "- Assign work items to team members and set priorities\n"
                "- Track status progression through workflow states\n"
                "- Bulk operations for managing multiple items\n"
                "- Work item relationships and dependencies\n"
                "- Due dates, estimates, and time tracking\n\n"
                "*Common Use Cases:* Bug tracking, feature development, user story management, "
                "task assignment, sprint planning, backlog management, issue triage."
            ),
        },
        {
            "name": "Work Item Links",
            "description": (
                "**External Resource Integration & References**\n\n"
                "Connect work items to external resources, documentation, repositories, and third-party systems. "
                "Essential for maintaining traceability between development work and external dependencies, "
                "documentation, design files, or related systems. Supports rich link metadata and validation.\n\n"
                "*Core Capabilities:*\n"
                "- Add, update, and remove external URL references\n"
                "- Link validation and metadata extraction\n"
                "- Reference tracking and relationship mapping\n"
                "- Integration with external tools and services\n"
                "- Link categorization and tagging\n"
                "- Access tracking and usage analytics\n\n"
                "*Common Use Cases:* Documentation linking, repository connections, design file references, "
                "external tool integration, dependency tracking, specification linking."
            ),
        },
        {
            "name": "Work Item Comments",
            "description": (
                "**Collaborative Discussions & Communication**\n\n"
                "Enable team collaboration through structured comment systems on work items. "
                "Supports rich discussions, code reviews, decision tracking, and team communication. "
                "Essential for maintaining context and team alignment on development work.\n\n"
                "*Core Capabilities:*\n"
                "- Threaded comment conversations and replies\n"
                "- Rich text formatting with markdown support\n"
                "- User mentions and notification triggers\n"
                "- Comment editing, deletion, and history tracking\n"
                "- File attachments and code snippets in comments\n"
                "- Comment reactions and acknowledgments\n\n"
                "*Common Use Cases:* Code review discussions, requirement clarifications, "
                "progress updates, decision documentation, team communication, knowledge sharing."
            ),
        },
        {
            "name": "Work Item Activity",
            "description": (
                "**Activity Monitoring & Search Intelligence**\n\n"
                "Comprehensive activity tracking and powerful search capabilities for work items. "
                "Maintains detailed audit trails, change histories, and enables intelligent discovery of work items. "
                "Critical for project transparency, compliance, and efficient information retrieval.\n\n"
                "*Core Capabilities:*\n"
                "- Complete activity logs and change history tracking\n"
                "- Advanced search with filters, sorting, and faceted navigation\n"
                "- Real-time activity feeds and notifications\n"
                "- Audit trail maintenance and compliance reporting\n"
                "- Cross-project search and discovery\n"
                "- Activity analytics and usage insights\n\n"
                "*Common Use Cases:* Compliance auditing, change tracking, work item discovery, "
                "progress monitoring, team activity analysis, project reporting."
            ),
        },
        {
            "name": "Work Item Attachments",
            "description": (
                "**Work Item File Attachments & Media**\n\n"
                "Manage file attachments directly associated with specific work items including screenshots, "
                "logs, design mockups, test cases, and supporting documentation. Provides secure file handling "
                "with version control and access management for development artifacts.\n\n"
                "*Core Capabilities:*\n"
                "- Multi-format file upload and attachment (images, documents, logs)\n"
                "- Secure file storage with access controls\n"
                "- File previews and thumbnail generation\n"
                "- Version tracking and file history\n"
                "- Bulk attachment operations\n"
                "- Integration with work item lifecycle\n\n"
                "*Common Use Cases:* Bug report screenshots, design mockups, test evidence, "
                "log files, specification documents, code snippets, wireframes."
            ),
        },
        # Project Organization
        {
            "name": "Cycles",
            "description": (
                "**Agile Sprint & Iteration Management**\n\n"
                "Organize development work into time-boxed iterations (sprints/cycles) following agile methodologies. "
                "Essential for scrum teams, sprint planning, velocity tracking, and iterative development processes. "
                "Provides structure for delivering software in regular, predictable intervals.\n\n"
                "*Core Capabilities:*\n"
                "- Sprint/cycle creation, planning, and management\n"
                "- Work item assignment to development cycles\n"
                "- Burndown charts and velocity tracking\n"
                "- Cycle analytics, reporting, and retrospectives\n"
                "- Automated cycle transitions and status updates\n"
                "- Capacity planning and workload distribution\n\n"
                "*Common Use Cases:* Sprint planning, agile development, iterative delivery, "
                "team velocity tracking, release planning, scrum ceremonies."
            ),
        },
        {
            "name": "Modules",
            "description": (
                "**Feature Modules & Product Roadmaps**\n\n"
                "Organize work items into logical feature modules and product roadmaps for strategic planning. "
                "Essential for product management, feature development tracking, and long-term roadmap visualization. "
                "Enables hierarchical organization of product initiatives and cross-project coordination.\n\n"
                "*Core Capabilities:*\n"
                "- Hierarchical module structure and feature grouping\n"
                "- Product roadmap creation and visualization\n"
                "- Cross-module progress tracking and reporting\n"
                "- Feature dependency management and planning\n"
                "- Module-based work item organization\n"
                "- Strategic milestone tracking and delivery planning\n\n"
                "*Common Use Cases:* Product roadmap planning, feature module organization, "
                "release planning, strategic initiative tracking, cross-team coordination, product portfolio management."
            ),
        },
        {
            "name": "States",
            "description": (
                "**Workflow States & Process Automation**\n\n"
                "Define and manage custom workflow states for work items with configurable transitions and automation rules. "
                "Essential for implementing team-specific processes, enforcing workflow compliance, and automating "
                "state transitions. Supports different workflow patterns for various project types and methodologies.\n\n"
                "*Core Capabilities:*\n"
                "- Custom workflow state definition and configuration\n"
                "- State transition rules and validation logic\n"
                "- Automated workflow triggers and actions\n"
                "- Workflow analytics and bottleneck identification\n"
                "- Role-based state transition permissions\n"
                "- Multi-project workflow templates and standardization\n\n"
                "*Common Use Cases:* Custom development workflows, approval processes, quality gates, "
                "status tracking, process standardization, workflow optimization, compliance enforcement."
            ),
        },
        {
            "name": "Labels",
            "description": (
                "**Taxonomies & Classification System**\n\n"
                "Flexible labeling and tagging system for categorizing and organizing work items across multiple dimensions. "
                "Enables custom taxonomies, priority classification, component grouping, and advanced filtering. "
                "Essential for information architecture and efficient work item discovery.\n\n"
                "*Core Capabilities:*\n"
                "- Custom label creation with color coding and icons\n"
                "- Hierarchical label structures and nested categories\n"
                "- Multi-dimensional tagging and classification\n"
                "- Advanced filtering, search, and faceted navigation\n"
                "- Label templates and standardization across projects\n"
                "- Label analytics and usage tracking\n\n"
                "*Common Use Cases:* Priority classification, component tagging, feature categorization, "
                "bug classification, skill tagging, team organization, content filtering."
            ),
        },
        # Team & User Management
        {
            "name": "Members",
            "description": (
                "**Team Collaboration & Access Control**\n\n"
                "Comprehensive team member management with role-based access control and permission systems. "
                "Essential for managing project teams, controlling access to sensitive information, and tracking "
                "team participation across projects. Supports flexible role hierarchies and delegation.\n\n"
                "*Core Capabilities:*\n"
                "- Role-based access control and permission management\n"
                "- Team member invitation and onboarding workflows\n"
                "- Project-level and workspace-level access controls\n"
                "- Member activity tracking and participation analytics\n"
                "- Team hierarchy and reporting relationships\n"
                "- Guest access and external collaboration controls\n\n"
                "*Common Use Cases:* Team onboarding, access control, permission management, "
                "external collaboration, role assignment, security compliance, team analytics."
            ),
        },
        {
            "name": "Users",
            "description": (
                "**User Identity & Profile Management**\n\n"
                "Comprehensive user account management including profiles, preferences, authentication, and personalization. "
                "Handles user lifecycle from registration through active participation, supporting both internal team members "
                "and external collaborators with customizable user experiences.\n\n"
                "*Core Capabilities:*\n"
                "- User profile creation, updates, and customization\n"
                "- Preference management and personalization settings\n"
                "- Authentication, authorization, and session management\n"
                "- User activity tracking and engagement analytics\n"
                "- Avatar management and visual identity\n"
                "- Multi-workspace user management and context switching\n\n"
                "*Common Use Cases:* User onboarding, profile management, preference configuration, "
                "identity verification, personalization, user analytics, cross-workspace access."
            ),
        },
        # System Features
        {
            "name": "Assets",
            "description": (
                "**Digital Asset & File Management System**\n\n"
                "Comprehensive file upload, storage, and delivery system for project assets including images, documents, "
                "videos, and other media files. Provides secure asset management with optimized delivery, version control, "
                "and integration with work items and project documentation.\n\n"
                "*Core Capabilities:*\n"
                "- Multi-format file upload and storage (images, documents, videos)\n"
                "- CDN-powered delivery and performance optimization\n"
                "- Asset organization, tagging, and metadata management\n"
                "- Secure access controls and permission management\n"
                "- Asset usage analytics and tracking\n"
                "- Integration with work items and comments\n\n"
                "*Common Use Cases:* Design asset management, documentation storage, "
                "project media libraries, user avatars, file attachments, resource sharing."
            ),
        },
        {
            "name": "Intake",
            "description": (
                "**Work Item Intake & Automated Triage**\n\n"
                "Sophisticated intake management system for processing and triaging incoming work items from various sources. "
                "Automates initial classification, priority assessment, and routing to appropriate teams. Essential for "
                "managing high-volume work intake and ensuring consistent processing standards.\n\n"
                "*Core Capabilities:*\n"
                "- Multi-channel work item intake and collection\n"
                "- Automated triage workflows and classification rules\n"
                "- Priority assessment and severity scoring\n"
                "- Intelligent routing and team assignment\n"
                "- Intake form customization and validation\n"
                "- SLA tracking and escalation management\n\n"
                "*Common Use Cases:* Bug report intake, feature request processing, support ticket triage, "
                "customer feedback collection, automated routing, quality gate enforcement."
            ),
        },
    ],
    # ========================================================================
    # Security & Authentication
    # ========================================================================
    "AUTHENTICATION_WHITELIST": [
        "plane.api.middleware.api_authentication.APIKeyAuthentication",
    ],
    # ========================================================================
    # Schema Generation Options
    # ========================================================================
    "COMPONENT_NO_READ_ONLY_REQUIRED": True,
    "COMPONENT_SPLIT_REQUEST": True,
}
