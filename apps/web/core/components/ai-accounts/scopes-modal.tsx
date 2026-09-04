/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAIAccount, TAIScopeAction, TAIScopePolicyInput, TAIScopeResourceType } from "@plane/types";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { aiAccountService } from "@/services/ai-account.service";
// local imports
import { AI_ACCOUNTS_LIST, AI_ACCOUNT_SCOPES, AI_SCOPE_ACTIONS, AI_SCOPE_RESOURCE_TYPES } from "./constants";

type Props = {
  account: TAIAccount;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

type TScopeRow = TAIScopePolicyInput & { key: string };

const getScopeRowKey = () => `scope-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createScopeRow = (data: TAIScopePolicyInput): TScopeRow => ({
  ...data,
  key: getScopeRowKey(),
});

export const AIScopesModal = observer(function AIScopesModal(props: Props) {
  const { account, isOpen, onClose, workspaceSlug } = props;
  // states
  const [scopeRows, setScopeRows] = useState<TScopeRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // hooks
  const { t } = useTranslation();
  const { projectMap, workspaceProjectIds, fetchProjects } = useProject();
  // refs
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // fetching workspace projects
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching account scopes
  const { data: scopes, isLoading } = useSWR(isOpen ? AI_ACCOUNT_SCOPES(workspaceSlug, account.id) : null, () =>
    aiAccountService.fetchAIScopes(workspaceSlug, account.id)
  );

  useEffect(() => {
    if (!scopes) return;
    setScopeRows(
      scopes.map((scope) =>
        createScopeRow({
          project: scope.project,
          resource_type: scope.resource_type,
          action: scope.action,
        })
      )
    );
  }, [scopes]);

  const workspaceProjects = (workspaceProjectIds ?? [])
    .map((projectId) => projectMap?.[projectId])
    .filter((project) => project !== undefined);

  const updateScopeRow = (rowKey: string, data: Partial<TAIScopePolicyInput>) =>
    setScopeRows((prevRows) => prevRows.map((row) => (row.key === rowKey ? { ...row, ...data } : row)));

  const removeScopeRow = (rowKey: string) => setScopeRows((prevRows) => prevRows.filter((row) => row.key !== rowKey));

  // Reopening before the delayed reset fires must run the reset immediately
  // instead of just cancelling the timer — otherwise stale rows from the
  // previous session would survive into the reopened modal
  useEffect(() => {
    if (isOpen && resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
      setScopeRows([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    []
  );

  const handleClose = () => {
    onClose();
    resetTimerRef.current = setTimeout(() => {
      setScopeRows([]);
      setIsSubmitting(false);
      resetTimerRef.current = null;
    }, 350);
  };

  const handleUpdateScopes = async () => {
    setIsSubmitting(true);
    try {
      await aiAccountService.updateAIScopes(
        workspaceSlug,
        account.id,
        scopeRows.map(({ project, resource_type, action }) => ({ project, resource_type, action }))
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.scopes.success.title"),
        message: t("workspace_settings.settings.ai_accounts.scopes.success.message"),
      });
      mutate(AI_ACCOUNTS_LIST(workspaceSlug));
      mutate(AI_ACCOUNT_SCOPES(workspaceSlug, account.id));
      handleClose();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.scopes.error.title"),
        message:
          (err as { message?: string })?.message ?? t("workspace_settings.settings.ai_accounts.scopes.error.message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex max-h-[70vh] flex-col">
        <div className="space-y-3 overflow-y-auto p-5">
          <h3 className="text-18 font-medium text-secondary">
            {t("workspace_settings.settings.ai_accounts.scopes.title")}
          </h3>
          <p className="text-13 text-placeholder">{t("workspace_settings.settings.ai_accounts.scopes.description")}</p>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 text-11 text-tertiary">
              <div>{t("workspace_settings.settings.ai_accounts.scopes.project")}</div>
              <div>{t("workspace_settings.settings.ai_accounts.scopes.resource_type")}</div>
              <div>{t("workspace_settings.settings.ai_accounts.scopes.action")}</div>
            </div>
            {isLoading ? (
              <div className="py-4 text-13 text-placeholder">{t("loading")}</div>
            ) : (
              scopeRows.map((row) => (
                <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_2rem] items-center gap-2">
                  <div>
                    <CustomSelect
                      className="w-full"
                      customButtonClassName="w-full"
                      customButton={
                        <div className="flex h-8 w-full items-center justify-between gap-2 rounded-md border-[0.5px] border-subtle px-2 text-13">
                          <span className="truncate">
                            {row.project
                              ? (projectMap?.[row.project]?.name ?? row.project)
                              : t("workspace_settings.settings.ai_accounts.scopes.all_projects")}
                          </span>
                          <ChevronDownIcon className="size-3 flex-shrink-0 text-tertiary" aria-hidden="true" />
                        </div>
                      }
                      optionsClassName="max-h-60 overflow-y-auto"
                      value={row.project ?? "all"}
                      onChange={(val: string) => updateScopeRow(row.key, { project: val === "all" ? null : val })}
                    >
                      <CustomSelect.Option value="all">
                        {t("workspace_settings.settings.ai_accounts.scopes.all_projects")}
                      </CustomSelect.Option>
                      {workspaceProjects.map((project) => (
                        <CustomSelect.Option key={project.id} value={project.id}>
                          {project.name}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <CustomSelect
                      className="w-full"
                      customButtonClassName="w-full"
                      customButton={
                        <div className="flex h-8 w-full items-center justify-between gap-2 rounded-md border-[0.5px] border-subtle px-2 text-13">
                          <span className="truncate">
                            {t(`workspace_settings.settings.ai_accounts.scopes.resources.${row.resource_type}`)}
                          </span>
                          <ChevronDownIcon className="size-3 flex-shrink-0 text-tertiary" aria-hidden="true" />
                        </div>
                      }
                      optionsClassName="max-h-60 overflow-y-auto"
                      value={row.resource_type}
                      onChange={(val: TAIScopeResourceType) => updateScopeRow(row.key, { resource_type: val })}
                    >
                      {AI_SCOPE_RESOURCE_TYPES.map((resourceType) => (
                        <CustomSelect.Option key={resourceType} value={resourceType}>
                          {t(`workspace_settings.settings.ai_accounts.scopes.resources.${resourceType}`)}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <CustomSelect
                      className="w-full"
                      customButtonClassName="w-full"
                      customButton={
                        <div className="flex h-8 w-full items-center justify-between gap-2 rounded-md border-[0.5px] border-subtle px-2 text-13">
                          <span className="truncate">
                            {t(`workspace_settings.settings.ai_accounts.scopes.actions.${row.action}`)}
                          </span>
                          <ChevronDownIcon className="size-3 flex-shrink-0 text-tertiary" aria-hidden="true" />
                        </div>
                      }
                      optionsClassName="max-h-60 overflow-y-auto"
                      value={row.action}
                      onChange={(val: TAIScopeAction) => updateScopeRow(row.key, { action: val })}
                    >
                      {AI_SCOPE_ACTIONS.map((action) => (
                        <CustomSelect.Option key={action} value={action}>
                          {t(`workspace_settings.settings.ai_accounts.scopes.actions.${action}`)}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeScopeRow(row.key)}
                      className="rounded p-1 text-tertiary hover:text-danger-primary"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setScopeRows((prevRows) => [
                  ...prevRows,
                  createScopeRow({ project: null, resource_type: "all", action: "all" }),
                ])
              }
            >
              <PlusIcon className="size-3" />
              {t("workspace_settings.settings.ai_accounts.scopes.add_scope")}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleUpdateScopes} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting
              ? t("workspace_settings.settings.ai_accounts.scopes.saving")
              : t("workspace_settings.settings.ai_accounts.scopes.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
