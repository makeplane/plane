/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { dueDateChangeRequiresReason } from "@/plane-web/helpers/due-date-reason.helper";

type TUseDueDateReasonGateArgs = {
  /** The persisted due date of the work item being edited (null while creating). */
  originalDate: string | null | undefined;
  /** True only when editing an existing work item. */
  isEditMode: boolean;
};

type TPendingChange = {
  date: string;
  commit: (value: string | null) => void;
};

export type TDueDateReasonGate = {
  isModalOpen: boolean;
  /** Captured reason for the current due-date change, or null when none applies. */
  reason: string | null;
  /**
   * Intercepts a due-date selection. Commits immediately when no reason is
   * required; otherwise defers the commit until the reason modal is confirmed.
   */
  handleDateChange: (newDate: string | null, commit: (value: string | null) => void) => void;
  /** Confirms the pending change with the supplied reason. */
  confirm: (reason: string) => Promise<void>;
  /** Cancels the pending change — the due date is left untouched. */
  close: () => void;
};

/**
 * Gates due-date edits behind a mandatory "reason" prompt inside the work item
 * create/update modal, matching the detail-sidebar behaviour. The captured
 * reason is held in form-local state and attached to the PATCH payload at
 * submit time by the consuming form.
 */
export const useDueDateReasonGate = ({ originalDate, isEditMode }: TUseDueDateReasonGateArgs): TDueDateReasonGate => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The captured reason is only ever read at submit time alongside a changed
  // target_date, and is always (re)set or cleared through handleDateChange for
  // the current interaction — so it never leaks across work items.
  const [reason, setReason] = useState<string | null>(null);
  const pendingRef = useRef<TPendingChange | null>(null);

  const handleDateChange = useCallback(
    (newDate: string | null, commit: (value: string | null) => void) => {
      if (!dueDateChangeRequiresReason(originalDate, newDate, isEditMode)) {
        // First set, clear, revert, or create — commit straight away and drop any stale reason.
        commit(newDate);
        setReason(null);
        return;
      }
      pendingRef.current = { date: newDate as string, commit };
      setIsModalOpen(true);
    },
    [originalDate, isEditMode]
  );

  const confirm = useCallback((nextReason: string): Promise<void> => {
    const pending = pendingRef.current;
    if (pending) {
      pending.commit(pending.date);
      setReason(nextReason);
    }
    pendingRef.current = null;
    setIsModalOpen(false);
    return Promise.resolve();
  }, []);

  const close = useCallback(() => {
    pendingRef.current = null;
    setIsModalOpen(false);
  }, []);

  return { isModalOpen, reason, handleDateChange, confirm, close };
};
