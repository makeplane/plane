/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Check, Loader2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TJiraBoard, TJiraCredentials, TJiraImportPayload, TJiraImportTarget, TJiraMetadata } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { JiraImportService } from "@/services/integrations/jira-import.service";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

enum EStep {
  CONNECT = 0,
  SELECT = 1,
  USERS = 2,
  MAPPING = 3,
  REVIEW = 4,
}

const PLANE_PRIORITIES = ["urgent", "high", "medium", "low", "none"];

const jiraImportService = new JiraImportService();

const emptyCredentials: TJiraCredentials = { domain: "", email: "", token: "" };

export const JiraImportWizard = observer(function JiraImportWizard(props: Props) {
  const { workspaceSlug, isOpen, onClose, onCreated } = props;
  const { t } = useTranslation();
  const { workspaceProjectIds, getProjectById } = useProject();

  // wizard state
  const [step, setStep] = useState<EStep>(EStep.CONNECT);
  const [credentials, setCredentials] = useState<TJiraCredentials>(emptyCredentials);
  const [connecting, setConnecting] = useState(false);
  const [boards, setBoards] = useState<TJiraBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<TJiraMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [target, setTarget] = useState<TJiraImportTarget>({ type: "new" });
  const [userImport, setUserImport] = useState<"invite" | "skip">("invite");
  const [autoCreateStates, setAutoCreateStates] = useState(true);
  const [priorityMap, setPriorityMap] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ components: true, comments: true, attachments: true, links: true });
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(EStep.CONNECT);
    setCredentials(emptyCredentials);
    setBoards([]);
    setSelectedBoardId(null);
    setMetadata(null);
    setTarget({ type: "new" });
    setUserImport("invite");
    setAutoCreateStates(true);
    setPriorityMap({});
    setFlags({ components: true, comments: true, attachments: true, links: true });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await jiraImportService.testConnection(workspaceSlug, credentials);
      if (!response.is_connected) throw new Error(response.error);
      const boardList = await jiraImportService.getBoards(workspaceSlug, credentials);
      setBoards(boardList);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira.connect.connected", { user: response.user ?? "" }),
        message: "",
      });
      setStep(EStep.SELECT);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.connect.connect_failed"),
        message: (error as { error?: string })?.error ?? "",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleLoadMetadata = async () => {
    if (!selectedBoardId) return;
    setLoadingMeta(true);
    try {
      const meta = await jiraImportService.getMetadata(workspaceSlug, credentials, selectedBoardId);
      setMetadata(meta);
      // prefill priority map with suggestions
      const nextPriorityMap: Record<string, string> = {};
      meta.priorities.forEach((p) => {
        nextPriorityMap[p.id] = p.suggested_priority;
      });
      setPriorityMap(nextPriorityMap);
      // prefill new-project name/identifier from the board's project
      if (target.type === "new" && selectedBoard) {
        setTarget({
          type: "new",
          name: selectedBoard.project_name ?? selectedBoard.name,
          identifier: (selectedBoard.project_key ?? "").toUpperCase(),
        });
      }
      setStep(EStep.USERS);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.toasts.error.title"),
        message: (error as { error?: string })?.error ?? "",
      });
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBoardId) return;
    setSubmitting(true);
    const payload: TJiraImportPayload = {
      ...credentials,
      board_id: selectedBoardId,
      target,
      user_import: userImport,
      state_map: {},
      priority_map: priorityMap,
      auto_create_states: autoCreateStates,
      flags,
    };
    try {
      await jiraImportService.createImportJob(workspaceSlug, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira.toasts.started.title"),
        message: t("workspace_settings.settings.imports.jira.toasts.started.message"),
      });
      onCreated();
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.toasts.error.title"),
        message: (error as { error?: string })?.error ?? "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = [
    t("workspace_settings.settings.imports.jira.steps.connect"),
    t("workspace_settings.settings.imports.jira.steps.select"),
    t("workspace_settings.settings.imports.jira.steps.users"),
    t("workspace_settings.settings.imports.jira.steps.mapping"),
    t("workspace_settings.settings.imports.jira.steps.review"),
  ];

  const canConnect = credentials.domain && credentials.email && credentials.token;
  const usersWithEmail = metadata?.users.filter((u) => u.email).length ?? 0;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXXL}>
      <div className="flex flex-col">
        {/* header + stepper */}
        <div className="border-b border-subtle px-5 py-4">
          <h3 className="text-18 font-medium text-secondary">
            {t("workspace_settings.settings.imports.jira.wizard_title")}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            {STEP_LABELS.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-10",
                    index < step
                      ? "bg-accent-primary text-on-color"
                      : index === step
                        ? "bg-accent-primary/20 text-accent-primary"
                        : "bg-layer-1 text-tertiary"
                  )}
                >
                  {index < step ? <Check className="size-3" /> : index + 1}
                </div>
                <span className={cn("text-11", index === step ? "text-secondary" : "text-tertiary")}>{label}</span>
                {index < STEP_LABELS.length - 1 && <span className="text-tertiary">›</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {/* STEP 1 - CONNECT */}
          {step === EStep.CONNECT && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.connect.domain")}
                </label>
                <Input
                  className="w-full"
                  value={credentials.domain}
                  onChange={(e) => setCredentials({ ...credentials, domain: e.target.value })}
                  placeholder={t("workspace_settings.settings.imports.jira.connect.domain_placeholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.connect.email")}
                </label>
                <Input
                  className="w-full"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder={t("workspace_settings.settings.imports.jira.connect.email_placeholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.connect.token")}
                </label>
                <Input
                  type="password"
                  className="w-full"
                  value={credentials.token}
                  onChange={(e) => setCredentials({ ...credentials, token: e.target.value })}
                  placeholder={t("workspace_settings.settings.imports.jira.connect.token_placeholder")}
                />
                <p className="mt-1 text-11 text-tertiary">
                  {t("workspace_settings.settings.imports.jira.connect.token_hint")}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 - SELECT BOARD + TARGET */}
          {step === EStep.SELECT && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.select.board")}
                </label>
                <select
                  className="w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-secondary"
                  value={selectedBoardId ?? ""}
                  onChange={(e) => setSelectedBoardId(Number(e.target.value))}
                >
                  <option value="">{t("workspace_settings.settings.imports.jira.select.board_placeholder")}</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name} {board.project_key ? `(${board.project_key})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.select.target")}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-13 text-secondary">
                    <input type="radio" checked={target.type === "new"} onChange={() => setTarget({ type: "new" })} />
                    {t("workspace_settings.settings.imports.jira.select.new_project")}
                  </label>
                  {target.type === "new" && (
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      <Input
                        className="w-full"
                        value={target.name ?? ""}
                        onChange={(e) => setTarget({ ...target, name: e.target.value })}
                        placeholder={t("workspace_settings.settings.imports.jira.select.project_name")}
                      />
                      <Input
                        className="w-full"
                        value={target.identifier ?? ""}
                        onChange={(e) => setTarget({ ...target, identifier: e.target.value.toUpperCase() })}
                        placeholder={t("workspace_settings.settings.imports.jira.select.project_identifier")}
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-13 text-secondary">
                    <input
                      type="radio"
                      checked={target.type === "existing"}
                      onChange={() => setTarget({ type: "existing" })}
                    />
                    {t("workspace_settings.settings.imports.jira.select.existing_project")}
                  </label>
                  {target.type === "existing" && (
                    <select
                      className="ml-6 w-[calc(100%-1.5rem)] rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-secondary"
                      value={target.project_id ?? ""}
                      onChange={(e) => setTarget({ type: "existing", project_id: e.target.value })}
                    >
                      <option value="">{t("workspace_settings.settings.imports.jira.select.select_project")}</option>
                      {(workspaceProjectIds ?? []).map((projectId) => (
                        <option key={projectId} value={projectId}>
                          {getProjectById(projectId)?.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.select.include")}
                </label>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      ["comments", "include_comments"],
                      ["attachments", "include_attachments"],
                      ["components", "include_components"],
                      ["links", "include_links"],
                    ] as const
                  ).map(([flag, labelKey]) => (
                    <label key={flag} className="flex items-center gap-2 text-13 text-secondary">
                      <input
                        type="checkbox"
                        checked={flags[flag]}
                        onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
                      />
                      {t(`workspace_settings.settings.imports.jira.select.${labelKey}`)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - USERS */}
          {step === EStep.USERS && metadata && (
            <div className="space-y-4">
              <p className="text-13 text-secondary">
                {t("workspace_settings.settings.imports.jira.users.summary", {
                  matched: usersWithEmail,
                  total: metadata.users.length,
                })}
              </p>
              <label className="flex items-center gap-2 text-13 text-secondary">
                <input type="radio" checked={userImport === "invite"} onChange={() => setUserImport("invite")} />
                {t("workspace_settings.settings.imports.jira.users.invite")}
              </label>
              <label className="flex items-center gap-2 text-13 text-secondary">
                <input type="radio" checked={userImport === "skip"} onChange={() => setUserImport("skip")} />
                {t("workspace_settings.settings.imports.jira.users.skip")}
              </label>
            </div>
          )}

          {/* STEP 4 - MAPPING */}
          {step === EStep.MAPPING && metadata && (
            <div className="space-y-5">
              <div>
                <h4 className="mb-2 text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.mapping.priorities")}
                </h4>
                <div className="space-y-2">
                  {metadata.priorities.map((priority) => (
                    <div key={priority.id} className="flex items-center gap-3">
                      <span className="w-40 text-13 text-secondary">{priority.name}</span>
                      <span className="text-tertiary">→</span>
                      <select
                        className="rounded-md border border-subtle bg-surface-1 px-2 py-1 text-13 text-secondary capitalize"
                        value={priorityMap[priority.id] ?? priority.suggested_priority}
                        onChange={(e) => setPriorityMap({ ...priorityMap, [priority.id]: e.target.value })}
                      >
                        {PLANE_PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-13 font-medium text-secondary">
                  {t("workspace_settings.settings.imports.jira.mapping.states")}
                </h4>
                <label className="flex items-center gap-2 text-13 text-secondary">
                  <input
                    type="checkbox"
                    checked={autoCreateStates}
                    onChange={(e) => setAutoCreateStates(e.target.checked)}
                  />
                  {t("workspace_settings.settings.imports.jira.mapping.auto_create")}
                </label>
                <p className="mt-1 text-11 text-tertiary">
                  {t("workspace_settings.settings.imports.jira.mapping.auto_create_hint")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {metadata.statuses.map((status) => (
                    <span key={status.id} className="rounded-md bg-layer-1 px-2 py-1 text-11 text-tertiary">
                      {status.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 - REVIEW */}
          {step === EStep.REVIEW && metadata && (
            <div className="space-y-3 text-13 text-secondary">
              <h4 className="text-14 font-medium">{t("workspace_settings.settings.imports.jira.review.heading")}</h4>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-tertiary">{t("workspace_settings.settings.imports.jira.review.board")}</span>
                <span>{selectedBoard?.name}</span>
                <span className="text-tertiary">{t("workspace_settings.settings.imports.jira.review.target")}</span>
                <span>
                  {target.type === "new"
                    ? `${target.name} (${target.identifier})`
                    : getProjectById(target.project_id)?.name}
                </span>
                <span className="text-tertiary">{t("workspace_settings.settings.imports.jira.review.users")}</span>
                <span>{userImport === "invite" ? metadata.users.length : 0}</span>
                <span className="text-tertiary">{t("workspace_settings.settings.imports.jira.review.work_items")}</span>
                <span>{metadata.issue_count}</span>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 border-t border-subtle px-5 py-4">
          <Button
            variant="secondary"
            onClick={step === EStep.CONNECT ? handleClose : () => setStep((s) => Math.max(0, s - 1) as EStep)}
          >
            {step === EStep.CONNECT ? t("cancel") : t("back")}
          </Button>
          <div>
            {step === EStep.CONNECT && (
              <Button variant="primary" loading={connecting} disabled={!canConnect} onClick={handleConnect}>
                {connecting ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("workspace_settings.settings.imports.jira.connect.connect_button")}
              </Button>
            )}
            {step === EStep.SELECT && (
              <Button
                variant="primary"
                loading={loadingMeta}
                disabled={
                  !selectedBoardId ||
                  (target.type === "existing" && !target.project_id) ||
                  (target.type === "new" && !target.name)
                }
                onClick={handleLoadMetadata}
              >
                {t("next")}
              </Button>
            )}
            {(step === EStep.USERS || step === EStep.MAPPING) && (
              <Button variant="primary" onClick={() => setStep((s) => (s + 1) as EStep)}>
                {t("next")}
              </Button>
            )}
            {step === EStep.REVIEW && (
              <Button variant="primary" loading={submitting} onClick={handleSubmit}>
                {t("workspace_settings.settings.imports.jira.review.confirm")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
