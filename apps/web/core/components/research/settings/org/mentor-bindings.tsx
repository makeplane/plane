/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMentorBinding, TOrgUnit } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import { ResearchPersonSelect } from "@/components/research/common/person-select";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  unit: TOrgUnit;
  onRelationsChanged?: () => Promise<void>;
  focusedBindingId?: string | null;
  onLocateMember?: (userId: string) => void;
};

/**
 * Direct advisor bindings: one research owner may have several advisors
 * (P0-ORG-06).
 */
export const ResearchMentorBindings = observer(function ResearchMentorBindings({
  workspaceSlug,
  unit,
  onRelationsChanged,
  focusedBindingId,
  onLocateMember,
}: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const memberStore = useMember();
  const [bindings, setBindings] = useState<TMentorBinding[]>([]);
  const [menteeEmail, setMenteeEmail] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [isPrimaryAdvisor, setIsPrimaryAdvisor] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [bindingToDelete, setBindingToDelete] = useState<TMentorBinding | null>(null);
  const workspaceMembers = memberStore.workspace
    .getWorkspaceMemberIds(workspaceSlug)
    .map((userId) => memberStore.getUserDetails(userId))
    .filter((member): member is NonNullable<typeof member> => !!member)
    .filter((member) => !memberStore.workspace.isUserSuspended(member.id, workspaceSlug));
  const resolveWorkspaceMember = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return workspaceMembers.find(
      (member) => member?.id.toLowerCase() === normalized || member?.email?.toLowerCase() === normalized
    );
  };
  const resolvedMentee = resolveWorkspaceMember(menteeEmail);
  const resolvedMentor = resolveWorkspaceMember(mentorEmail);
  const today = new Date().toLocaleDateString("en-CA");
  const menteeIds = new Set(
    (research.orgUnitMembers[unit.id] ?? [])
      .filter(
        (member) =>
          member.is_primary && member.effective_from <= today && (!member.effective_to || member.effective_to >= today)
      )
      .map((member) => member.user)
  );

  const load = useCallback(async () => {
    try {
      const results = await research.fetchMentorBindings(workspaceSlug, { org_unit: unit.id });
      setBindings(results);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [research, unit.id, workspaceSlug]);

  useEffect(() => {
    let current = true;
    setMenteeEmail("");
    setMentorEmail("");
    setBindings([]);
    setIsPrimaryAdvisor(false);
    setErrorKey(null);
    setLoading(true);
    setLoadFailed(false);
    Promise.all([
      research.fetchMentorBindings(workspaceSlug, { org_unit: unit.id }),
      research.fetchOrgUnitMembers(workspaceSlug, unit.id),
      memberStore.workspace.fetchWorkspaceMembers(workspaceSlug),
    ])
      .then(([data]) => {
        if (current) setBindings(data);
        return undefined;
      })
      .catch((error) => {
        if (current) {
          setErrorKey(getResearchErrorKey(error));
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    if (!focusedBindingId || loading) return;
    document.getElementById(`mentor-binding-${focusedBindingId}`)?.scrollIntoView({ block: "center" });
  }, [focusedBindingId, loading]);

  const handleCreate = useCallback(async () => {
    if (!resolvedMentee || !resolvedMentor || busy) return;
    setBusy(true);
    try {
      await research.createMentorBinding(workspaceSlug, {
        mentee: resolvedMentee.id,
        mentor: resolvedMentor.id,
        org_unit: unit.id,
        is_primary_advisor: isPrimaryAdvisor,
      });
      setMenteeEmail("");
      setMentorEmail("");
      setIsPrimaryAdvisor(false);
      await load();
      await onRelationsChanged?.();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.mentor_created.title"),
        message: t("research.feedback.mentor_created.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    isPrimaryAdvisor,
    load,
    onRelationsChanged,
    research,
    resolvedMentee,
    resolvedMentor,
    t,
    unit.id,
    workspaceSlug,
  ]);

  const handleDelete = useCallback(async () => {
    if (!bindingToDelete || busy) return;
    setBusy(true);
    try {
      await research.deleteMentorBinding(workspaceSlug, bindingToDelete.id);
      await load();
      await onRelationsChanged?.();
      setBindingToDelete(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.mentor_removed.title"),
        message: t("research.feedback.mentor_removed.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [bindingToDelete, busy, load, onRelationsChanged, research, t, workspaceSlug]);

  return (
    <div className="flex flex-col gap-3">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <ResearchPersonSelect
          label="选择本组学生 / 科研责任人"
          people={workspaceMembers.filter((member) => menteeIds.has(member.id))}
          value={menteeEmail}
          onChange={setMenteeEmail}
          disabled={busy || loading || loadFailed}
        />
        <ResearchPersonSelect
          label="选择导师"
          people={workspaceMembers.filter((member) => member.id !== menteeEmail)}
          value={mentorEmail}
          onChange={setMentorEmail}
          disabled={busy || loading || loadFailed}
        />
        <label className="flex items-center gap-2 pb-1 text-12 text-secondary">
          <input
            type="checkbox"
            checked={isPrimaryAdvisor}
            onChange={(event) => setIsPrimaryAdvisor(event.target.checked)}
          />
          <span>{t("research.org.primary_advisor")}</span>
        </label>
        <Button
          variant="primary"
          size="sm"
          loading={busy && !bindingToDelete}
          disabled={
            busy || loading || loadFailed || !resolvedMentee || !resolvedMentor || !menteeIds.has(resolvedMentee.id)
          }
          onClick={() => void handleCreate()}
        >
          {t("research.org.bind_mentor")}
        </Button>
      </div>
      {loading && (
        <p role="status" className="text-12">
          正在加载指导关系…
        </p>
      )}
      {(menteeEmail.trim() || mentorEmail.trim()) && (
        <div className="flex flex-wrap gap-3 text-11" role="status">
          <span className={resolvedMentee ? "text-success-primary" : "text-danger-primary"}>
            {resolvedMentee
              ? t("research.org.resolved_mentee", { member: resolvedMentee.display_name || resolvedMentee.email })
              : t("research.org.mentee_not_found")}
          </span>
          <span className={resolvedMentor ? "text-success-primary" : "text-danger-primary"}>
            {resolvedMentor
              ? t("research.org.resolved_mentor", { member: resolvedMentor.display_name || resolvedMentor.email })
              : t("research.org.mentor_not_found")}
          </span>
        </div>
      )}

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.org.columns.mentee")}</th>
            <th className="font-normal py-2">{t("research.org.columns.mentor")}</th>
            <th className="font-normal py-2">{t("research.org.columns.advisor_kind")}</th>
            <th className="font-normal py-2">{t("research.org.columns.effective_from")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {bindings.map((binding) => (
            <tr
              id={`mentor-binding-${binding.id}`}
              key={binding.id}
              className={`border-b border-subtle/60 ${focusedBindingId === binding.id ? "bg-accent-primary/10" : ""}`}
            >
              <td className="py-2 text-secondary">
                <button
                  type="button"
                  className="text-left text-accent-primary"
                  onClick={() => onLocateMember?.(binding.mentee)}
                >
                  {binding.mentee_detail?.display_name ?? binding.mentee_detail?.email ?? binding.mentee}
                </button>
                <span className="block text-11 text-tertiary">{binding.mentee_detail?.email}</span>
              </td>
              <td className="py-2 text-secondary">
                <button
                  type="button"
                  className="text-left text-accent-primary"
                  onClick={() => onLocateMember?.(binding.mentor)}
                >
                  {binding.mentor_detail?.display_name ?? binding.mentor_detail?.email ?? binding.mentor}
                </button>
                <span className="block text-11 text-tertiary">{binding.mentor_detail?.email}</span>
              </td>
              <td className="py-2 text-tertiary">
                {t(binding.is_primary_advisor ? "research.org.primary_advisor" : "research.org.co_advisor")}
              </td>
              <td className="py-2 text-tertiary">{binding.effective_from}</td>
              <td className="py-2 text-right">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setBindingToDelete(binding)}>
                  {t("research.common.remove")}
                </Button>
              </td>
            </tr>
          ))}
          {!loading && !loadFailed && bindings.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-center text-tertiary">
                {t("research.org.no_mentor_bindings")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <AlertModalCore
        isOpen={Boolean(bindingToDelete)}
        handleClose={() => {
          if (!busy) setBindingToDelete(null);
        }}
        handleSubmit={() => void handleDelete()}
        isSubmitting={busy}
        title={t("research.org.confirm.mentor.title")}
        content={t("research.org.confirm.mentor.description", {
          mentee:
            bindingToDelete?.mentee_detail?.display_name ??
            bindingToDelete?.mentee_detail?.email ??
            bindingToDelete?.mentee ??
            "",
          mentor:
            bindingToDelete?.mentor_detail?.display_name ??
            bindingToDelete?.mentor_detail?.email ??
            bindingToDelete?.mentor ??
            "",
          unit: unit.name,
        })}
        primaryButtonText={{ default: t("research.common.remove"), loading: t("research.common.loading") }}
        secondaryButtonText={t("research.common.cancel")}
        variant="danger"
      />
    </div>
  );
});
