/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState, Fragment } from "react";
import { Transition } from "@headlessui/react";
import { TextArea } from "@plane/ui";
import { Switch } from "@plane/propel/switch";
import { Play, RotateCw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane web components
// plane web hooks
import { useFlag, useJiraImporter } from "@/plane-web/hooks/store";
// plane web  utils
import { cn } from "@plane/utils";
// plane web  types
import type { TImporterDataPayload } from "@/types/importers";
import { E_IMPORTER_STEPS } from "@/types/importers";
import { E_FEATURE_FLAGS } from "@plane/constants";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

interface ConfigureJiraCustomJQLProps {
  projectId: string | undefined;
  projectKey: string;
  useCustomJql: boolean;
  onFormDataUpdate: (key: keyof TFormData, value: any) => void;
  onValidationChange: (isValid: boolean) => void;
  workspaceSlug: string | undefined;
  workspaceId: string | undefined;
  userId: string | undefined;
}

export const ConfigureJiraCustomJQL: React.FC<ConfigureJiraCustomJQLProps> = ({
  projectId,
  projectKey,
  useCustomJql,
  onFormDataUpdate,
  onValidationChange,
  workspaceSlug,
  workspaceId,
  userId,
}) => {
  const { t } = useTranslation();
  const isEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.JIRA_CONFIGURE_JQL);
  const { data: dataState } = useJiraImporter();
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [issueCount, setIssueCount] = useState<number | undefined>(undefined);
  const [rawJQL, setRawJQL] = useState<string | undefined>("");
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const isValidating = validationStatus === "validating";

  const handleValidateJql = async () => {
    if (!projectId || !rawJQL || !workspaceId || !userId) return;

    setValidationStatus("validating");
    setValidationError(undefined);

    try {
      const response = await dataState.validateJql(workspaceId, userId, projectKey, rawJQL);
      if (response) {
        if (response.issueCount === 0) {
          setValidationStatus("invalid");
          setValidationError(t("jira_importer.steps.no_work_items_selected"));
          setIssueCount(0);
        } else {
          setValidationStatus("valid");
          setIssueCount(response.issueCount);
          onFormDataUpdate("jql", response.executedJQL);
        }
      }
    } catch (error: any) {
      setValidationStatus("invalid");
      setValidationError(error?.error || t("jira_importer.steps.validation_error_default"));
    }
  };

  // reset validation status when JQL or toggle or project changes
  useEffect(() => {
    setValidationStatus("idle");
    setIssueCount(undefined);
    setValidationError(undefined);
    setRawJQL("");
  }, [useCustomJql, projectId]);

  // sync valid state with parent
  useEffect(() => {
    const isValid = !useCustomJql || (validationStatus === "valid" && issueCount !== undefined && issueCount > 0);
    onValidationChange(isValid);
  }, [useCustomJql, validationStatus, issueCount, onValidationChange]);

  if (!isEnabled) {
    return null;
  }

  return (
    <Transition
      as={Fragment}
      show={!!projectId}
      enter="transition-all duration-300 ease-in-out"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-300 ease-in-out"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-2"
    >
      <div className="flex flex-col gap-2 border border-subtle bg-layer-2 rounded-lg p-4 transition-all overflow-hidden w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-12 font-medium text-secondary">{t("jira_importer.steps.custom_jql_filter")}</div>
            <div className="text-10 text-tertiary">{t("jira_importer.steps.jql_filter_description")}</div>
          </div>
          <div className="flex items-center gap-3">
            <Transition
              as={Fragment}
              show={useCustomJql}
              enter="transition-all duration-300 ease-in-out"
              enterFrom="opacity-0 translate-x-2"
              enterTo="opacity-100 translate-x-0"
              leave="transition-all duration-300 ease-in-out"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-2"
            >
              <button
                type="button"
                onClick={handleValidateJql}
                disabled={isValidating}
                title={
                  validationStatus === "valid"
                    ? t("jira_importer.steps.refresh")
                    : t("jira_importer.steps.check_syntax")
                }
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md transition-all shrink-0",
                  validationStatus === "valid"
                    ? "text-success-primary hover:bg-success-primary/10"
                    : "text-accent-primary hover:bg-accent-primary/10"
                )}
              >
                {validationStatus === "valid" ? (
                  <RotateCw className={cn("w-4 h-4", isValidating && "animate-spin")} />
                ) : (
                  <Play className={cn("w-4 h-4")} />
                )}
              </button>
            </Transition>
            <Switch value={useCustomJql} onChange={(value) => onFormDataUpdate("useCustomJql", value)} size="sm" />
          </div>
        </div>

        <Transition
          as={Fragment}
          show={useCustomJql}
          enter="transition-all duration-300 ease-in-out"
          enterFrom="grid-rows-[0fr] opacity-0"
          enterTo="grid-rows-[1fr] opacity-100"
          leave="transition-all duration-300 ease-in-out"
          leaveFrom="grid-rows-[1fr] opacity-100"
          leaveTo="grid-rows-[0fr] opacity-0"
        >
          <div className="grid overflow-hidden min-h-0 pt-1">
            <div className="flex items-start bg-layer-2 border-[0.5px] border-subtle-1 rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-1 border-r border-subtle-1 text-10 font-medium font-mono text-tertiary whitespace-nowrap self-stretch">
                {t("jira_importer.steps.project_code")} = &quot;{projectKey}&quot; AND
              </div>
              <TextArea
                id="jql"
                name="jql"
                value={rawJQL}
                onChange={(e) => setRawJQL(e.target.value)}
                placeholder={t("jira_importer.steps.enter_filters_placeholder")}
                className="w-full text-10 border-none bg-transparent"
                textAreaSize="sm"
                mode="true-transparent"
                rows={2}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-4 border-t border-subtle-1 pt-2">
              <div className="flex-1">
                {validationStatus === "validating" && (
                  <div className="text-10 font-medium text-secondary flex items-center gap-1.5 transition-all">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("jira_importer.steps.validating_query")}
                  </div>
                )}
                {validationStatus === "valid" && issueCount !== undefined && (
                  <div className="text-10 font-medium text-success-primary flex items-center gap-1.5 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {t("jira_importer.steps.validation_successful_work_items_selected", { count: issueCount })}
                  </div>
                )}
                {validationStatus === "invalid" && validationError && (
                  <div className="text-10 font-medium text-danger-primary flex items-start gap-1.5 transition-all">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {validationError}
                  </div>
                )}
                {validationStatus === "idle" && (
                  <div className="text-10 text-tertiary">{t("jira_importer.steps.run_syntax_check")}</div>
                )}
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  );
};
