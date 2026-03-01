# Enterprise Edition Module

Enterprise-specific features and functionality.

## Purpose

Contains all enterprise/commercial features for self-managed and cloud deployments.

## Enterprise Models

### Planning & Organization

| Model      | Purpose                      |
| ---------- | ---------------------------- |
| Initiative | Strategic initiatives/epics  |
| Teamspace  | Organizational team grouping |
| Milestone  | Project milestones           |
| Dashboard  | Custom dashboards            |

### Customer Features

| Model            | Purpose                |
| ---------------- | ---------------------- |
| Customer         | Customer portal users  |
| CustomerProperty | Custom customer fields |
| Intake           | Feature request inbox  |

### Automation

| Model             | Purpose                |
| ----------------- | ---------------------- |
| Automation        | Automation definitions |
| AutomationVersion | Version tracking       |
| AutomationNode    | Automation nodes       |
| AutomationEdge    | Node connections       |
| AutomationRun     | Execution tracking     |
| NodeExecution     | Node execution logs    |

### Templates & Workflows

| Model     | Purpose                     |
| --------- | --------------------------- |
| Template  | Project/issue templates     |
| Workflow  | Custom workflows            |
| Recurring | Recurring issue definitions |

## Background Tasks

Located in `bgtasks/` (27+ task modules):

- Workspace billing sync
- Entity progress tracking
- OpenSearch indexing
- Cycle maintenance
- Enterprise-specific notifications

## Utilities

### workspace_features.py

Feature flag management for enterprise features.

### state_progress.py

Progress tracking across entities.

### validators.py

Enterprise-specific validation logic.

## Integration

- Feature flags via `plane.payment.flags`
- License validation via `plane.license`
- Extended permissions for enterprise roles
