"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { Button } from "@plane/ui";
// helpers
import { E_IMPORTER_KEYS } from "@silo/core";
import { cn } from "@/helpers/common.helper";
// silo components
import { useSyncConfig } from "@/plane-web/silo/hooks";
import { ImportUsersFromJiraUploader } from "@/plane-web/silo/jira/components";
// silo hooks
import { useImporter } from "@/plane-web/silo/jira/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/jira/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA];

const currentStepKey = E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA;

export const ImportUsersFromJira: FC = () => {
  // hooks
  const { data: syncConfigData } = useSyncConfig(E_IMPORTER_KEYS.JIRA);
  const { importerData, handleImporterData, handleSyncJobConfig, currentStep, handleStepper } = useImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({
    userSkipToggle: false,
    userData: undefined,
  });
  // derived values
  const isNextButtonDisabled =
    formData.userSkipToggle || (formData.userSkipToggle === false && formData?.userData ? false : true);
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const isOAuthEnabled = syncConfigData?.isOAuthEnabled;
  const isResourceFiledRequired = isOAuthEnabled ? !!jiraResourceId : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));

    if (key === "userSkipToggle") {
      handleSyncJobConfig("users", "");
    }
    if (key === "userData" && !formData.userSkipToggle && typeof value === "string") {
      handleSyncJobConfig("users", value);
    }
  };

  const handleOnClickNext = () => {
    // update the data in the context
    handleImporterData(currentStepKey, formData);
    // moving to the next state
    handleStepper("next");
  };

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
        {/* skipping users checkbox */}
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 cursor-pointer"
            onClick={() => handleFormData("userSkipToggle", !formData.userSkipToggle)}
          >
            <div
              className={cn(
                "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-sm transition-all",
                { "border-custom-primary-100": formData.userSkipToggle }
              )}
            >
              <div
                className={cn("w-full h-full bg-custom-background-80 transition-all", {
                  "bg-custom-primary-100": formData.userSkipToggle,
                })}
              />
            </div>
            <div className="text-sm text-custom-text-100">Skip importing User data</div>
          </div>
          {/* when skipping we are showing the error below */}
          {formData.userSkipToggle && (
            <div className="text-sm text-red-500">
              Skipping user import will result in issues, comments, and other data from Jira being created by the user
              performing the migration in Plane. You can still manually add users later.
            </div>
          )}
        </div>

        {/* uploading the users from jira */}
        {!formData.userSkipToggle && isResourceFiledRequired && (
          <div className="space-y-4">
            <div className="text-sm">
              Upload a CSV file to import user data&nbsp;
              <a
                target="_blank"
                href="https://support.atlassian.com/organization-administration/docs/export-users-from-a-site/"
                className="text-custom-primary-100 underline font-medium"
              >
                from Jira
              </a>
            </div>
            <ImportUsersFromJiraUploader
              handleValue={(value: string | undefined) => handleFormData("userData", value)}
            />
          </div>
        )}
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={false}>
            Next
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
};
