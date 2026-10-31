/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLeaveType } from "./work-calendar";

export type TLeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type TLeaveRequest = {
  id: string;
  user: string;
  start_date: string;
  end_date: string;
  leave_type: TLeaveType;
  note: string;
  status: TLeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string;
  created_at: string;
};

export type TLeaveRequestPayload = {
  start_date: string;
  end_date: string;
  leave_type: TLeaveType;
  note?: string;
};

export type TLeaveAction = "approve" | "reject" | "cancel";
