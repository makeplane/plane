"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { PublishTemplate } from "@/plane-web/components/templates/settings/publish";
import { useProjectTemplates } from "@/plane-web/hooks/store";

const PublishProjectTemplatePage = observer(() => {
  // router
  const { workspaceSlug, templateId } = useParams();
  // store hooks
  const { isInitializingTemplates, getTemplateById } = useProjectTemplates();
  // derived values
  const templateInstance = getTemplateById(templateId?.toString());

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES_PUBLISH}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES_PUBLISH} />}
    >
      <PublishTemplate
        workspaceSlug={workspaceSlug?.toString()}
        templateInstance={templateInstance}
        isInitializing={isInitializingTemplates}
      />
    </WithFeatureFlagHOC>
  );
});

export default PublishProjectTemplatePage;
