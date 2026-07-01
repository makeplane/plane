/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// Plane imports
import { WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TProjectTemplate } from "@plane/types";
// components
import { ProjectService } from "@/services/project";
// local imports
import { ProjectTemplateDeactivateModal } from "../deactivate-modal";
import { ProjectTemplateRow } from "./template-row";
import { ProjectTemplatesListLoader } from "./loader";

type TProjectTemplatesListRoot = {
  workspaceSlug: string;
};

const projectService = new ProjectService();

/**
 * Distinct SWR key variant for the include-inactive fetch (D-14 / 04-01).
 *
 * The active-only fetch keeps the canonical WORKSPACE_PROJECT_TEMPLATES(slug)
 * key so the Phase 3 create-modal selector stays unaffected. The include-
 * inactive fetch uses a suffixed key so its data lives in a separate cache
 * slot and never overwrites the active-only cache used elsewhere.
 */
const WORKSPACE_PROJECT_TEMPLATES_INCLUDE_INACTIVE = (workspaceSlug: string) =>
  `WORKSPACE_PROJECT_TEMPLATES_${workspaceSlug.toUpperCase()}_INCLUDE_INACTIVE`;

/**
 * Two-section grouped list of project templates.
 * Renders System templates and Custom templates as labeled sections fetched
 * live from the project templates endpoint via SWR.
 *
 * States:
 *  - Loading:  Loader skeleton
 *  - Error:    inline copy + retry button (non-blocking)
 *  - Custom empty: EmptyStateCompact in the Custom section
 *  - Populated: rows grouped under their respective heading
 *  - Show-deactivated (D-06): toggle reveals deactivated custom rows under the
 *    Custom section; Reactivate action (D-07/D-15) flips is_active back.
 */
export const ProjectTemplatesListRoot = observer(function ProjectTemplatesListRoot(props: TProjectTemplatesListRoot) {
  const { workspaceSlug } = props;
  // router
  const router = useRouter();
  // translation
  const { t } = useTranslation();

  // Show-deactivated toggle state (D-06).
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Active-only fetch — keeps the canonical key for the create-modal selector.
  const activeSWR = useSWR(
    workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
    () => projectService.getProjectTemplates(workspaceSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // Include-inactive fetch — only when the toggle is on. Uses a DISTINCT SWR
  // key so the active-only cache stays intact (D-14).
  const includeInactiveSWR = useSWR(
    workspaceSlug && showDeactivated ? WORKSPACE_PROJECT_TEMPLATES_INCLUDE_INACTIVE(workspaceSlug) : null,
    () => projectService.getProjectTemplates(workspaceSlug, true),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // Resolve the rows the UI actually renders:
  //  - When toggle is OFF: use the active-only list (built-ins + active custom).
  //  - When toggle is ON: use the include-inactive list and split into
  //    active custom vs inactive custom. Built-ins remain active-only and
  //    read-only regardless of the toggle (D-14).
  const sourceRows: TProjectTemplate[] = showDeactivated
    ? (includeInactiveSWR.data ?? activeSWR.data ?? [])
    : (activeSWR.data ?? []);

  // Deactivate modal state.
  const [templateToDeactivate, setTemplateToDeactivate] = useState<TProjectTemplate | null>(null);

  const handleNewTemplate = () => {
    router.push(`/${workspaceSlug}/settings/templates/new`);
  };

  // Loading state — only the active-only fetch needs to finish for the
  // skeleton to leave (the include-inactive fetch has its own gating key).
  if (!activeSWR.data && !activeSWR.error) {
    return <ProjectTemplatesListLoader />;
  }

  // Error state — non-blocking inline retry per UI-SPEC
  if (activeSWR.error && !activeSWR.data) {
    return (
      <div
        className="rounded-lg border border-subtle bg-layer-1 px-4 py-6 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-body-sm-regular text-secondary">
          {t("workspace_settings.settings.project_templates.error.load")}
        </p>
        <div className="mt-3 flex justify-center">
          <Button
            variant="secondary"
            size="base"
            onClick={() => {
              void activeSWR.mutate();
              if (showDeactivated) void includeInactiveSWR.mutate();
            }}
          >
            {t("workspace_settings.settings.project_templates.error.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const systemTemplates: TProjectTemplate[] = sourceRows.filter((tpl) => tpl.is_system);
  const customActive: TProjectTemplate[] = sourceRows.filter((tpl) => !tpl.is_system && tpl.is_active);
  const customInactive: TProjectTemplate[] = sourceRows.filter((tpl) => !tpl.is_system && !tpl.is_active);

  // Revalidate both SWR keys after a deactivate so the row leaves the active
  // list immediately. Used as an onClose handler for the deactivate modal.
  const handleDeactivateSuccess = async () => {
    setTemplateToDeactivate(null);
    await Promise.all([activeSWR.mutate(), showDeactivated ? includeInactiveSWR.mutate() : Promise.resolve()]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* System templates section — built-ins stay active-only, read-only. */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h6-medium text-primary">
            {t("workspace_settings.settings.project_templates.system_section.title")}
          </h2>
          <p className="text-body-xs-regular text-tertiary">
            {t("workspace_settings.settings.project_templates.system_section.description")}
          </p>
        </div>
        {systemTemplates.length > 0 ? (
          <div className="flex flex-col gap-3">
            {systemTemplates.map((template) => (
              <ProjectTemplateRow key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-subtle bg-layer-1 px-4 py-6 text-center">
            <p className="text-body-sm-regular text-tertiary">
              {t("workspace_settings.settings.project_templates.system_section.title")}
            </p>
          </div>
        )}
      </section>

      {/* Custom templates section — with Show-deactivated toggle (D-06). */}
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h6-medium text-primary">
              {t("workspace_settings.settings.project_templates.custom_section.title")}
            </h2>
            <p className="text-body-xs-regular text-tertiary">
              {t("workspace_settings.settings.project_templates.custom_section.description")}
            </p>
          </div>
          {/* Show-deactivated toggle — accent color when engaged (UI-SPEC Color). */}
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span className="text-body-xs-regular text-secondary">
              {t("workspace_settings.settings.project_templates.show_deactivated")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showDeactivated}
              onClick={() => setShowDeactivated((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showDeactivated ? "bg-accent-primary" : "bg-layer-1"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface-1 transition-transform ${
                  showDeactivated ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        {customActive.length > 0 ? (
          <div className="flex flex-col gap-3">
            {customActive.map((template) => (
              <ProjectTemplateRow
                key={template.id}
                template={template}
                onDeactivate={(tpl) => setTemplateToDeactivate(tpl)}
              />
            ))}
          </div>
        ) : (
          !showDeactivated && (
            <EmptyStateCompact
              assetKey="template"
              assetClassName="size-20"
              title={t("workspace_settings.settings.project_templates.empty.title")}
              description={t("workspace_settings.settings.project_templates.empty.description")}
              actions={[
                {
                  label: t("workspace_settings.settings.project_templates.new_template"),
                  onClick: handleNewTemplate,
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          )
        )}

        {/* Deactivated custom rows — only when toggle is ON. */}
        {showDeactivated && customInactive.length > 0 && (
          <div className="flex flex-col gap-3">
            {customInactive.map((template) => (
              <ProjectTemplateRow
                key={template.id}
                template={template}
                onDeactivate={(tpl) => setTemplateToDeactivate(tpl)}
              />
            ))}
          </div>
        )}

        {/* Toggle ON with zero deactivated rows: explicit empty copy. */}
        {showDeactivated && customInactive.length === 0 && (
          <div className="rounded-lg border border-dashed border-subtle bg-layer-1 px-4 py-6 text-center">
            <p className="text-body-sm-regular text-tertiary">
              {t("workspace_settings.settings.project_templates.no_deactivated_templates")}
            </p>
          </div>
        )}
      </section>

      {/* Deactivate confirmation modal — opens when a row's Deactivate is clicked. */}
      <ProjectTemplateDeactivateModal
        isOpen={templateToDeactivate !== null}
        template={templateToDeactivate}
        onClose={handleDeactivateSuccess}
      />
    </div>
  );
});
