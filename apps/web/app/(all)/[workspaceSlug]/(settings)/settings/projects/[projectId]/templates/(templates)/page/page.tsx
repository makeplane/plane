"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel } from "@plane/constants";
// plane web imports
import { useTranslation } from "@plane/i18n";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { CreateUpdatePageTemplate } from "@/plane-web/components/templates/settings/page";
const CreateProjectLevelPageTemplatePage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  // derived values
  const templateId = searchParams.get("templateId");
  const { t } = useTranslation();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.PAGE_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PAGE_TEMPLATES} />}
    >
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-xl font-medium">{t("templates.settings.new_page_template")}</h3>
        </div>
      </div>
      <CreateUpdatePageTemplate
        workspaceSlug={workspaceSlug?.toString()}
        currentLevel={ETemplateLevel.PROJECT}
        projectId={projectId?.toString()}
        templateId={templateId ?? undefined}
      />
    </WithFeatureFlagHOC>
  );
});

export default CreateProjectLevelPageTemplatePage;
