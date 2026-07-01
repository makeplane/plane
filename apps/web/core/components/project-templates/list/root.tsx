/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRouter } from "next/navigation";
import useSWR from "swr";
// plane imports
import { WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TProjectTemplate } from "@plane/types";
// components
import { ProjectService } from "@/services/project";
// local imports
import { ProjectTemplateRow } from "./template-row";
import { ProjectTemplatesListLoader } from "./loader";

type TProjectTemplatesListRoot = {
  workspaceSlug: string;
};

const projectService = new ProjectService();

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
 */
export function ProjectTemplatesListRoot(props: TProjectTemplatesListRoot) {
  const { workspaceSlug } = props;
  // router
  const router = useRouter();
  // translation
  const { t } = useTranslation();

  const { data, error, mutate } = useSWR(
    workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
    () => projectService.getProjectTemplates(workspaceSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const handleNewTemplate = () => {
    router.push(`/${workspaceSlug}/settings/templates/new`);
  };

  // Loading state
  if (!data && !error) {
    return <ProjectTemplatesListLoader />;
  }

  // Error state — non-blocking inline retry per UI-SPEC
  if (error && !data) {
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
          <Button variant="secondary" size="base" onClick={() => void mutate()}>
            {t("workspace_settings.settings.project_templates.error.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const templates = data ?? [];
  const systemTemplates: TProjectTemplate[] = templates.filter((tpl) => tpl.is_system);
  const customTemplates: TProjectTemplate[] = templates.filter((tpl) => !tpl.is_system);

  return (
    <div className="flex flex-col gap-6">
      {/* System templates section */}
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

      {/* Custom templates section */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h6-medium text-primary">
            {t("workspace_settings.settings.project_templates.custom_section.title")}
          </h2>
          <p className="text-body-xs-regular text-tertiary">
            {t("workspace_settings.settings.project_templates.custom_section.description")}
          </p>
        </div>
        {customTemplates.length > 0 ? (
          <div className="flex flex-col gap-3">
            {customTemplates.map((template) => (
              <ProjectTemplateRow key={template.id} template={template} />
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
