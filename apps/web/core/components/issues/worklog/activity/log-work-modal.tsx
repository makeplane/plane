/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { isoToLocalInput, localInputToISO } from "../utils";

type TLogWorkPanel = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  onClose: () => void;
};

const inputClassName =
  "w-full rounded border border-subtle bg-surface-2 p-2 text-sm text-primary outline-none focus:border-accent-strong";

export const LogWorkPanel = observer(function LogWorkPanel(props: TLogWorkPanel) {
  const { workspaceSlug, projectId, issueId, onClose } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { worklog } = useIssueDetail();
  const panelRef = useRef<HTMLDivElement>(null);

  const isAdmin = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN;

  // sensible defaults: one hour of work ending now
  const now = new Date();
  const [start, setStart] = useState<string>(isoToLocalInput(new Date(now.getTime() - 60 * 60 * 1000).toISOString()));
  const [end, setEnd] = useState<string>(isoToLocalInput(now.toISOString()));
  const [description, setDescription] = useState("");
  const [loggedBy, setLoggedBy] = useState<string>(currentUser?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // close on outside click; ignore the native date/time popups and portaled dropdowns (member picker)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target)) return;
      if (target.closest?.("[data-prevent-outside-click]")) return;
      onClose();
    };
    // defer so the click that opened the panel doesn't immediately close it
    const id = window.setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const handleSave = async () => {
    const startISO = localInputToISO(start);
    const endISO = localInputToISO(end);
    if (!startISO || !endISO) {
      setError(t("common.worklog_invalid_range"));
      return;
    }
    const duration = Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 1000);
    if (duration < 60) {
      setError(t("common.worklog_invalid_range"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await worklog.createWorklog(workspaceSlug, projectId, issueId, {
        started_at: startISO,
        logged_at: startISO,
        duration,
        description: description.trim() || undefined,
        logged_by: loggedBy || currentUser?.id,
      });
      onClose();
    } catch {
      setError(t("common.error"));
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 z-20 mt-1 w-80 space-y-3 rounded-lg border border-subtle bg-surface-1 p-3 shadow-raised-200"
    >
      <h3 className="text-body-sm-semibold text-primary">{t("common.log_work")}</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-tertiary">{t("common.worklog_start")}</label>
        <input
          type="datetime-local"
          value={start}
          max={end || undefined}
          onChange={(e) => setStart(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-tertiary">{t("common.worklog_end")}</label>
        <input
          type="datetime-local"
          value={end}
          min={start || undefined}
          onChange={(e) => setEnd(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-tertiary">
          {t("common.description")} ({t("common.optional")})
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t("common.worklog_description_placeholder")}
          className={`resize-none ${inputClassName}`}
        />
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-tertiary">{t("common.log_work_for")}</label>
          <MemberDropdown
            value={loggedBy}
            onChange={(val: string | null) => setLoggedBy(val ?? currentUser?.id ?? "")}
            projectId={projectId}
            multiple={false}
            buttonVariant="border-with-text"
            placeholder={t("common.select_member")}
          />
        </div>
      )}

      {error && <p className="text-xs text-danger-primary">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={submitting}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
});
