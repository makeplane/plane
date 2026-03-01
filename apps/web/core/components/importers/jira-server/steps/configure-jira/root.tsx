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

import { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web components
import {
  ConfigureJiraSelectResource,
  ConfigureJiraSelectProject,
  ConfigureJiraCustomJQL,
} from "@/components/importers/jira-server";
import { StepperNavigation } from "@/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web  utils
// plane web  types
import type { TImporterDataPayload } from "@/types/importers/jira-server";
import { E_IMPORTER_STEPS } from "@/types/importers/jira-server";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_JIRA;

export const ConfigureJiraRoot = observer(function ConfigureJiraRoot() {
  // hooks
  const { currentStep, handleStepper, importerData, handleImporterData, handleSyncJobConfig } = useJiraServerImporter();
  const { t } = useTranslation();
  const { data: userData } = useUser();
  const { currentWorkspace } = useWorkspace();

  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;
  const userId = userData?.id;

  // states
  const [formData, setFormData] = useState<TFormData>({
    resourceId: undefined,
    projectId: undefined,
    useCustomJql: false,
    jql: "",
  });
  const [isJqlValid, setIsJqlValid] = useState(true);

  // derived values
  const {
    data: { getJiraProjectById },
  } = useJiraServerImporter();
  const selectedProject =
    formData.resourceId && formData.projectId ? getJiraProjectById(formData.resourceId, formData.projectId) : undefined;
  const projectKey = selectedProject?.key || "";

  const shouldShowProjectSelector = formData.resourceId;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const handleOnClickNext = () => {
    handleImporterData(currentStepKey, formData);
    handleSyncJobConfig("useCustomJql", formData.useCustomJql);
    handleSyncJobConfig("jql", formData.jql);
    handleStepper("next");
  };

  const isNextButtonDisabled = !formData.resourceId || !formData?.projectId || !isJqlValid;
  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-4">
        {/* section handled jira workspace and projects */}
        <ConfigureJiraSelectResource
          value={formData.resourceId}
          handleFormData={(value: string | undefined) => handleFormData("resourceId", value)}
        />
        {shouldShowProjectSelector && (
          <ConfigureJiraSelectProject
            resourceId={formData.resourceId}
            value={formData.projectId}
            handleFormData={(value: string | undefined) => handleFormData("projectId", value)}
          />
        )}
        <ConfigureJiraCustomJQL
          projectId={formData.projectId}
          projectKey={projectKey}
          useCustomJql={formData.useCustomJql || false}
          onFormDataUpdate={handleFormData}
          onValidationChange={setIsJqlValid}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          userId={userId}
        />
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
