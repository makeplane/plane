"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane web imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { CreateUpdateProjectTemplate } from "@/plane-web/components/templates/settings/project";

const CreateProjectTemplatePage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // derived values
  const templateId = searchParams.get("templateId");

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES}
      fallback={<TemplatesUpgrade flag={E_FEATURE_FLAGS.PROJECT_TEMPLATES} />}
    >
      <CreateUpdateProjectTemplate workspaceSlug={workspaceSlug?.toString()} templateId={templateId ?? undefined} />
    </WithFeatureFlagHOC>
  );
});

export default CreateProjectTemplatePage;
