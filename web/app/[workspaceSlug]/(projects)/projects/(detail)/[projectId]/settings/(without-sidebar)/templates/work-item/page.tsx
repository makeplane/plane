"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { ETemplateLevel } from "@plane/constants";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IssueModalProvider } from "@/plane-web/components/issues/issue-modal";
import { TemplatesUpgrade } from "@/plane-web/components/templates/settings";
import { CreateUpdateWorkItemTemplate } from "@/plane-web/components/templates/settings/work-item";

const CreateProjectLevelWorkItemTemplatePage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  // derived values
  const templateId = searchParams.get("templateId");

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="WORKITEM_TEMPLATES"
      fallback={<TemplatesUpgrade />}
    >
      <IssueModalProvider>
        <CreateUpdateWorkItemTemplate
          workspaceSlug={workspaceSlug?.toString()}
          templateId={templateId ?? undefined}
          projectId={projectId?.toString()}
          currentLevel={ETemplateLevel.PROJECT}
        />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
});

export default CreateProjectLevelWorkItemTemplatePage;
