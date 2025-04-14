"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IssueModalProvider } from "@/plane-web/components/issues/issue-modal";
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
      flag="PROJECT_TEMPLATES"
      fallback={<TemplatesUpgrade />}
    >
      <IssueModalProvider>
        <CreateUpdateProjectTemplate workspaceSlug={workspaceSlug?.toString()} templateId={templateId ?? undefined} />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
});

export default CreateProjectTemplatePage;
