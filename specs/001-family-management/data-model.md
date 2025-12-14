# Data Model: FamilyFlow

**Feature**: FamilyFlow - Agile Home Management  
**Date**: 2025-12-12  
**Phase**: 1 - Design

## Overview

The FamilyFlow data model transforms the Plane project management concepts into family-oriented household management. This document defines all entities, their relationships, validation rules, and state transitions.

## Core Entities

### Family

Represents a household unit with multiple family members collaborating on household tasks.

**Fields**:
- `id` (UUID, Primary Key)
- `name` (String, required, max 200 chars) - Family name/household identifier
- `sprint_duration` (Integer, default 7) - Sprint duration in days (7 for weekly, 14 for bi-weekly)
- `default_swim_lanes` (JSON, default list) - Default category list: ["Chores", "School/Activities", "Home Projects", "Family Time", "Individual Goals"]
- `custom_swim_lanes` (JSON, nullable) - Custom categories families can add
- `gamification_enabled` (Boolean, default True) - Enable/disable gamification features
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Has many `FamilyMember`
- Has many `BacklogItem`
- Has many `Sprint`
- Has many `Retrospective`

**Validation Rules**:
- `name` must be unique (within system, across families)
- `sprint_duration` must be 7 or 14
- `default_swim_lanes` must contain at least one category

**State Transitions**: None (static entity)

---

### FamilyMember

Represents an individual user within a family. Extends base User model with family-specific attributes.

**Fields**:
- `id` (UUID, Primary Key)
- `user_id` (Foreign Key to User, required) - Links to authentication system
- `family_id` (Foreign Key to Family, required)
- `name` (String, required, max 200 chars) - Display name in family context
- `age` (Integer, nullable) - Age for age-appropriate UI (nullable for adults)
- `role` (String, choices: "parent", "child", required) - Family role
- `avatar_url` (String, nullable) - Profile picture URL
- `joined_at` (DateTime, auto)
- `is_active` (Boolean, default True)

**Relationships**:
- Belongs to `Family`
- Belongs to `User` (authentication)
- Has many `Task` (assigned tasks)
- Has many `StandupEntry`
- Has many `Achievement`

**Validation Rules**:
- `age` required if `role` is "child"
- `age` must be >= 0 and <= 120
- `role` must be one of ["parent", "child"]
- Combination of `user_id` and `family_id` must be unique

**State Transitions**:
- `is_active`: True ↔ False (members can be deactivated)

---

### BacklogItem

Represents a task, chore, project, event, or goal that needs family attention. Items can be promoted to sprints.

**Fields**:
- `id` (UUID, Primary Key)
- `family_id` (Foreign Key to Family, required)
- `title` (String, required, max 500 chars)
- `description` (Text, nullable) - Rich text description
- `category` (String, required) - Swim lane category
- `priority` (Integer, default 0) - Higher number = higher priority (for ordering)
- `story_points` (Integer, nullable) - Effort estimate (optional in backlog)
- `creator_id` (Foreign Key to FamilyMember, required)
- `status` (String, choices: "backlog", "sprint", "archived", default "backlog")
- `is_template` (Boolean, default False) - For recurring tasks
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Belongs to `Family`
- Belongs to `FamilyMember` (creator)
- Has one `Task` (when promoted to sprint)

**Validation Rules**:
- `title` cannot be empty or whitespace
- `category` must exist in family's swim lanes (default or custom)
- `priority` must be >= 0
- `story_points` must be >= 0 if provided
- `status` must be one of ["backlog", "sprint", "archived"]

**State Transitions**:
- `status`: "backlog" → "sprint" (when added to sprint)
- `status`: "sprint" → "backlog" (when removed from sprint)
- `status`: Any → "archived" (when archived)

---

### Sprint

Represents a time-boxed work period (weekly or bi-weekly) where families commit to completing selected backlog items.

**Fields**:
- `id` (UUID, Primary Key)
- `family_id` (Foreign Key to Family, required)
- `name` (String, required, max 200 chars) - Sprint identifier (e.g., "Week of Jan 1-7")
- `start_date` (Date, required)
- `end_date` (Date, required)
- `status` (String, choices: "planning", "active", "completed", "paused", required)
- `total_story_points` (Integer, default 0) - Total committed story points
- `completed_story_points` (Integer, default 0) - Completed story points
- `created_by_id` (Foreign Key to FamilyMember, required)
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Belongs to `Family`
- Belongs to `FamilyMember` (creator)
- Has many `Task`
- Has many `StandupEntry`
- Has one `Retrospective`

**Validation Rules**:
- `end_date` must be after `start_date`
- `end_date - start_date` must match family's `sprint_duration`
- `total_story_points` must be >= 0
- `completed_story_points` must be <= `total_story_points`
- Only one sprint per family can have status "active" or "planning"

**State Transitions**:
- `status`: "planning" → "active" (when sprint starts)
- `status`: "active" → "completed" (when sprint ends)
- `status`: "active" → "paused" (if family needs break)
- `status`: "paused" → "active" (resume sprint)

---

### Task

Represents a backlog item that has been added to a sprint. Inherits attributes from BacklogItem and adds sprint-specific workflow.

**Fields**:
- `id` (UUID, Primary Key)
- `backlog_item_id` (Foreign Key to BacklogItem, required, unique)
- `sprint_id` (Foreign Key to Sprint, required)
- `assigned_to_id` (Foreign Key to FamilyMember, nullable) - Can be unassigned or assigned to one member
- `workflow_state` (String, choices: "to_do", "in_progress", "blocked", "done", default "to_do")
- `story_points` (Integer, required) - Story points for this sprint (copied from backlog, can be modified)
- `completed_at` (DateTime, nullable) - When task was marked done
- `blocker_reason` (Text, nullable) - Reason if blocked
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Belongs to `BacklogItem`
- Belongs to `Sprint`
- Belongs to `FamilyMember` (assigned_to, nullable)

**Validation Rules**:
- `story_points` must be >= 0
- `workflow_state` must be one of ["to_do", "in_progress", "blocked", "done"]
- `blocker_reason` required if `workflow_state` is "blocked"
- `completed_at` set automatically when `workflow_state` becomes "done"

**State Transitions**:
- `workflow_state`: "to_do" → "in_progress" → "done"
- `workflow_state`: Any → "blocked" (with reason)
- `workflow_state`: "blocked" → "in_progress" or "to_do"
- `workflow_state`: "done" → cannot change (completed tasks are final)

---

### StandupEntry

Represents a daily check-in from a family member during an active sprint.

**Fields**:
- `id` (UUID, Primary Key)
- `family_member_id` (Foreign Key to FamilyMember, required)
- `sprint_id` (Foreign Key to Sprint, required)
- `date` (Date, required) - Date of standup
- `accomplishments_yesterday` (Text, nullable) - What I did yesterday
- `plans_today` (Text, nullable) - What I'll do today
- `blockers` (Text, nullable) - Any blockers or concerns
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Belongs to `FamilyMember`
- Belongs to `Sprint`

**Validation Rules**:
- One standup entry per family member per sprint per day (unique constraint)
- `date` must be within sprint's `start_date` and `end_date`
- At least one field (accomplishments_yesterday, plans_today, blockers) must be provided

**State Transitions**: None (created once per day, can be updated)

---

### Retrospective

Represents a reflection session at the end of a sprint.

**Fields**:
- `id` (UUID, Primary Key)
- `sprint_id` (Foreign Key to Sprint, required, unique) - One retrospective per sprint
- `conducted_at` (DateTime, auto)
- `what_went_well` (JSON) - Array of responses from family members
- `what_didnt_work` (JSON) - Array of responses from family members
- `what_to_change` (JSON) - Array of responses from family members
- `action_items` (JSON) - Array of action items (strings) to add to backlog
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships**:
- Belongs to `Sprint`

**Validation Rules**:
- `sprint_id` must reference a completed sprint
- Each JSON array can contain multiple responses (from different family members)

**State Transitions**: None (created once per sprint)

---

### Achievement

Represents gamification milestones and rewards earned by family members.

**Fields**:
- `id` (UUID, Primary Key)
- `family_member_id` (Foreign Key to FamilyMember, required)
- `achievement_type` (String, choices: "points", "badge", "streak", required)
- `achievement_name` (String, required) - Name of badge/achievement (e.g., "Task Master", "5-Day Streak")
- `points` (Integer, nullable) - Points earned (if type is "points")
- `badge_icon` (String, nullable) - Icon identifier for badge
- `related_task_id` (Foreign Key to Task, nullable) - Task that triggered achievement
- `earned_at` (DateTime, auto)

**Relationships**:
- Belongs to `FamilyMember`
- Belongs to `Task` (nullable)

**Validation Rules**:
- `points` required if `achievement_type` is "points"
- `badge_icon` required if `achievement_type` is "badge"
- `achievement_name` must be unique per family member per type (no duplicate badges)

**State Transitions**: None (achievements are permanent once earned)

---

## Aggregate Models

### FamilyMemberStats

Computed aggregate for gamification and progress tracking (not stored, computed on-demand).

**Fields**:
- `total_points` (Integer) - Sum of all points earned
- `total_tasks_completed` (Integer) - Count of completed tasks
- `current_streak` (Integer) - Consecutive days with task completion
- `longest_streak` (Integer) - Longest streak achieved
- `badges_earned` (Array) - List of badge names earned

**Computation**: Aggregated from `Task` and `Achievement` tables via queries.

---

## Database Constraints

### Unique Constraints
- `FamilyMember`: (`user_id`, `family_id`)
- `StandupEntry`: (`family_member_id`, `sprint_id`, `date`)
- `Retrospective`: (`sprint_id`)
- `Achievement`: (`family_member_id`, `achievement_type`, `achievement_name`)

### Foreign Key Constraints
- All foreign keys use CASCADE delete (except where noted)
- `Task.backlog_item_id` uses RESTRICT delete (prevent deleting backlog item if task exists)

### Indexes
- `BacklogItem`: Index on `family_id`, `category`, `status`, `priority`
- `Task`: Index on `sprint_id`, `assigned_to_id`, `workflow_state`
- `Sprint`: Index on `family_id`, `status`, `start_date`, `end_date`
- `StandupEntry`: Index on `sprint_id`, `date`
- `FamilyMember`: Index on `family_id`, `role`, `is_active`

---

## State Machine Diagrams

### Task Workflow State Machine

```
[to_do] ──assign──> [to_do] (assigned)
  │                      │
  │ start work          │ start work
  ▼                      ▼
[in_progress] <─────────┘
  │
  │ ┌──────────────────┐
  ├─┴─> [blocked] ─────┤ (with reason)
  │     │              │
  │     │ unblock      │ complete
  ├─────┴──────────────┴─> [done]
  │                          │
  └──────────────────────────┘ (final state)
```

### Sprint State Machine

```
[planning] ──start──> [active] ──end──> [completed]
               │           │
               │           └──pause──> [paused]
               │                      │
               └──────────────────────┘ (resume)
```

---

## Supabase-Specific Considerations

### Row Level Security (RLS)

All tables will have RLS policies enforcing family-level isolation:

- `Family`: Members can only access their own family
- `FamilyMember`: Members can only see members of their family
- `BacklogItem`: Members can only access items from their family
- `Task`: Members can only access tasks from their family's sprints
- `Sprint`: Members can only access sprints from their family
- `StandupEntry`: Members can only see standups from their family
- `Retrospective`: Members can only access retrospectives from their family
- `Achievement`: Members can only see achievements within their family

### Realtime Subscriptions

Tables enabled for realtime:
- `Task` - For real-time sprint board updates
- `Sprint` - For sprint status changes
- `StandupEntry` - For daily standup updates
- `BacklogItem` - For backlog changes

---

## Migration Notes

### From Plane Models

Existing Plane models that can be referenced for structure:
- `Workspace` → `Family`
- `User` → `FamilyMember` (extends User)
- `Issue` → `BacklogItem` / `Task`
- `Cycle` → `Sprint`

New models (no Plane equivalent):
- `StandupEntry`
- `Retrospective`
- `Achievement`

Migration strategy: Create new models alongside existing ones, add feature flags to switch modes.

