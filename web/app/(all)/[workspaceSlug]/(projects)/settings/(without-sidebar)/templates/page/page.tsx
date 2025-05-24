"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel } from "@plane/constants";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { CreateUpdatePageTemplate } from "@/plane-web/components/templates/settings/page/create-update";

const CreateWorkspaceLevelPageTemplatePage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // derived values
  const templateId = searchParams.get("templateId");

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.PAGE_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PAGE_TEMPLATES} />}
    >
      <CreateUpdatePageTemplate
        workspaceSlug={workspaceSlug?.toString()}
        currentLevel={ETemplateLevel.WORKSPACE}
        templateId={templateId ?? undefined}
      />
    </WithFeatureFlagHOC>
  );
});

export default CreateWorkspaceLevelPageTemplatePage;
