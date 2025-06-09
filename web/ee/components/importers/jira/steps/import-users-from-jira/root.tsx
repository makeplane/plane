"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane packages imports
import { pullUsers } from "@plane/etl/jira";
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// plane web components
import { ImportUsersFromJiraUploader } from "@/plane-web/components/importers/jira";
import { AddSeatsAlertBanner, SkipUserImport, StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/jira";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA];

const currentStepKey = E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA;

export const ImportUsersFromJira: FC = observer(() => {
  // hooks
  const {
    user,
    workspace,
    auth: { currentAuth },
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { additionalUsersData, fetchAdditionalUsers },
  } = useJiraImporter();
  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();

  const { t } = useTranslation();

  // states
  const [formData, setFormData] = useState<TFormData>({
    userSkipToggle: false,
    userData: undefined,
  });

  // derived values
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const isOAuthEnabled = currentAuth?.isOAuthEnabled;
  const isResourceFiledRequired = isOAuthEnabled ? !!jiraResourceId : true;
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));

    if (key === "userSkipToggle" && typeof value === "boolean") {
      handleSyncJobConfig("users", "");
      handleSyncJobConfig("skipUserImport", value);
    }
    if (key === "userData" && !formData.userSkipToggle && typeof value === "string") {
      handleSyncJobConfig("users", value);
      handleSyncJobConfig("skipUserImport", true);
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

  const { isLoading: isJiraAdditionalUsersDataLoading } = useSWR(
    workspaceId && userId && workspaceSlug && formData.userData
      ? `IMPORTER_JIRA_ADDITIONAL_USERS_${workspaceId}_${userId}_${workspaceSlug}`
      : null,
    workspaceId && userId && workspaceSlug && formData.userData
      ? async () => fetchAdditionalUsers(workspaceId, userId, workspaceSlug, pullUsers(formData.userData || ""))
      : null,
    { errorRetryCount: 0 }
  );

  const extraSeatRequired = additionalUsersData?.additionalUserCount - currentWorkspaceSubscriptionAvailableSeats;
  const isNextButtonDisabled = Boolean(extraSeatRequired > 0 && !formData.userSkipToggle) || Boolean(!formData.userSkipToggle && !formData.userData);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-4">
        {/* skipping users checkbox and alert */}
        {isJiraAdditionalUsersDataLoading ? (
          <Loader.Item height="35px" width="100%" />
        ) : extraSeatRequired && formData.userData && !formData.userSkipToggle ? (
          <AddSeatsAlertBanner
            additionalUserCount={additionalUsersData?.additionalUserCount}
            extraSeatRequired={extraSeatRequired}
          />
        ) : (
          <></>
        )}
        <SkipUserImport
          importSourceName="Jira"
          userSkipToggle={formData.userSkipToggle}
          handleUserSkipToggle={(value) => handleFormData("userSkipToggle", value)}
        />

        {/* uploading the users from jira */}
        {!formData.userSkipToggle && isResourceFiledRequired && (
          <div className="space-y-4">
            <div className="text-sm">
              {t("importers.upload_csv_file")}
              <a
                target="_blank"
                href="https://support.atlassian.com/organization-administration/docs/export-users-from-a-site/"
                className="text-custom-primary-100 underline font-medium"
              >
                {t("common.from", { "name": "Jira" })}
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
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
