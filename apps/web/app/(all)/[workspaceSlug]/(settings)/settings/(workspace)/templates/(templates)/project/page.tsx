"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane web imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IssueModalProvider } from "@/plane-web/components/issues/issue-modal/provider";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { CreateUpdateProjectTemplate } from "@/plane-web/components/templates/settings/project";

const CreateProjectTemplatePage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // store hooks
  const { t } = useTranslation();
  // derived values
  const templateId = searchParams.get("templateId");

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES} />}
    >
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-xl font-medium">{t("templates.settings.new_project_template")}</h3>
        </div>
      </div>
      <IssueModalProvider>
        <CreateUpdateProjectTemplate workspaceSlug={workspaceSlug?.toString()} templateId={templateId ?? undefined} />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
});

export default CreateProjectTemplatePage;
