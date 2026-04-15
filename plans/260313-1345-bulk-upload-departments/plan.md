---
title: "Bulk Upload Department in God Mode"
description: "Add CSV bulk import for departments in admin God Mode panel"
status: pending
priority: P2
effort: 5h
branch: triho
tags: [god-mode, departments, bulk-upload, backend, frontend]
created: 2026-03-13
---

# Bulk Upload Department — God Mode

## Overview

Add a "Bulk Upload" button to the God Mode Departments page (`/god-mode/departments/`) that allows admins to import multiple departments from a CSV file.

**Reference pattern:** Staff bulk import (`/api/instances/staff/bulk-import/` + `staff-import-modal.tsx`)

## Phases

| #   | Phase                                    | Status  | Est. |
| --- | ---------------------------------------- | ------- | ---- |
| 1   | [Backend API](./phase-01-backend-api.md) | pending | 2h   |
| 2   | [Frontend UI](./phase-02-frontend-ui.md) | pending | 3h   |

## Key Files

**Backend:**

- Model: `apps/api/plane/db/models/department.py`
- Instance views: `apps/api/plane/license/api/views/department.py`
- Instance URLs: `apps/api/plane/license/api/urls/department.py`
- Reference (staff bulk): `apps/api/plane/license/api/views/staff.py`

**Frontend (admin app):**

- Departments page: `apps/admin/app/(all)/(dashboard)/departments/`
- Reference modal: `apps/admin/app/(all)/(dashboard)/staff/components/staff-import-modal.tsx`
- Store: `apps/admin/store/instance-department.store.ts`
- Services: `packages/services/src/` (add department service with `bulkImport`)
