/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { Layers, Plus, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssueServiceType } from "@plane/types";
import type { ISearchIssueResponse, TIssue, TIssueSubIssues, TSubIssuesStateDistribution } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { IssueService } from "@/services/issue/issue.service";

const issueService = new IssueService(EIssueServiceType.ISSUES);

const GROUP_ORDER: (keyof TSubIssuesStateDistribution)[] = [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "cancelled",
];

const GROUP_BAR: Record<keyof TSubIssuesStateDistribution, string> = {
  backlog: "bg-tertiary",
  unstarted: "bg-layer-3",
  started: "bg-accent-primary",
  completed: "bg-success-primary",
  cancelled: "bg-danger-primary",
};

const GROUP_DOT: Record<keyof TSubIssuesStateDistribution, string> = {
  backlog: "bg-tertiary",
  unstarted: "bg-layer-3",
  started: "bg-accent-primary",
  completed: "bg-success-primary",
  cancelled: "bg-danger-primary",
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicChildrenPanel = observer(function EpicChildrenPanel(props: Props) {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const swrKey = `EPIC_CHILDREN_${projectId}_${epicId}`;
  const { data, isLoading } = useSWR<TIssueSubIssues>(
    workspaceSlug && epicId ? swrKey : null,
    workspaceSlug && epicId ? () => issueService.subIssues(workspaceSlug, projectId, epicId) : null
  );

  const projectIdentifier = getProjectById(projectId)?.identifier ?? "";

  const children: TIssue[] = useMemo(() => {
    if (!data?.sub_issues) return [];
    return Array.isArray(data.sub_issues) ? data.sub_issues : Object.values(data.sub_issues).flat();
  }, [data]);

  const distribution = data?.state_distribution;
  const groupOf = useMemo(() => {
    const map: Record<string, keyof TSubIssuesStateDistribution> = {};
    if (distribution) {
      GROUP_ORDER.forEach((group) => (distribution[group] ?? []).forEach((id) => (map[id] = group)));
    }
    return map;
  }, [distribution]);

  const counts = useMemo(() => {
    const result = { total: 0, completed: 0 } as { total: number; completed: number };
    if (distribution) {
      GROUP_ORDER.forEach((group) => (result.total += (distribution[group] ?? []).length));
      result.completed = (distribution.completed ?? []).length;
    }
    return result;
  }, [distribution]);

  const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  const handleAddChildren = async (selected: ISearchIssueResponse[]) => {
    if (!selected.length) return;
    try {
      await issueService.addSubIssues(workspaceSlug, projectId, epicId, {
        sub_issue_ids: selected.map((issue) => issue.id),
      });
      mutate(swrKey);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleRemoveChild = async (childId: string) => {
    try {
      await issueService.patchIssue(workspaceSlug, projectId, childId, { parent_id: null });
      mutate(swrKey);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-subtle bg-surface-1 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-13 font-medium text-secondary">
          <Layers className="size-4 text-accent-primary" />
          {t("epic.children.title")}
          {counts.total > 0 && <span className="text-11 text-tertiary">({counts.total})</span>}
        </div>
        {!disabled && (
          <Button
            variant="tertiary"
            size="sm"
            prependIcon={<Plus className="size-3" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t("epic.children.add")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <Loader className="space-y-2">
          <Loader.Item height="10px" />
          <Loader.Item height="28px" />
        </Loader>
      ) : counts.total === 0 ? (
        <p className="py-2 text-12 text-tertiary">{t("epic.children.empty")}</p>
      ) : (
        <>
          {/* progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-11 text-tertiary">
              <span>{t("epic.children.progress", { completed: counts.completed, total: counts.total })}</span>
              <span>{progress}%</span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-layer-1">
              {GROUP_ORDER.map((group) => {
                const width = counts.total > 0 ? ((distribution?.[group]?.length ?? 0) / counts.total) * 100 : 0;
                if (width === 0) return null;
                return <div key={group} className={GROUP_BAR[group]} style={{ width: `${width}%` }} />;
              })}
            </div>
          </div>

          {/* children list */}
          <div className="space-y-1">
            {children.map((child) => {
              const group = groupOf[child.id];
              return (
                <div
                  key={child.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-layer-transparent-hover"
                >
                  {group && <span className={`size-2 shrink-0 rounded-full ${GROUP_DOT[group]}`} />}
                  {projectIdentifier && (
                    <span className="shrink-0 text-11 text-tertiary">
                      {projectIdentifier}-{child.sequence_id}
                    </span>
                  )}
                  <span className="truncate text-12 text-secondary">{child.name}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className="ml-auto text-tertiary opacity-0 group-hover:opacity-100 hover:text-danger-primary"
                      title={t("epic.children.remove")}
                      onClick={() => handleRemoveChild(child.id)}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-10 text-tertiary">{t("epic.children.manage_hint")}</p>
        </>
      )}

      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isAddModalOpen}
        handleClose={() => setIsAddModalOpen(false)}
        searchParams={{ sub_issue: true, issue_id: epicId }}
        handleOnSubmit={handleAddChildren}
        shouldHideIssue={(issue) => issue.id === epicId || children.some((child) => child.id === issue.id)}
      />
    </div>
  );
});
