import React, { useState } from "react";

// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// swr
import { mutate } from "swr";

// react hook form
import { FormProvider, useForm } from "react-hook-form";

// icons
import { ArrowLeftIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { CogIcon, CloudUploadIcon, UsersIcon, CheckIcon } from "components/icons";

// services
import jiraImporterService from "services/integration/jira.service";

// fetch keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";

// components
import { PrimaryButton, SecondaryButton } from "components/ui";
import {
  JiraGetImportDetail,
  JiraProjectDetail,
  JiraImportUsers,
  JiraConfirmImport,
  jiraFormDefaultValues,
  TJiraIntegrationSteps,
  IJiraIntegrationData,
} from "./";

import JiraLogo from "public/services/jira.png";

import { IJiraImporterForm } from "types";

const integrationWorkflowData: Array<{
  title: string;
  key: TJiraIntegrationSteps;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}> = [
  {
    title: "Configure",
    key: "import-configure",
    icon: CogIcon,
  },
  {
    title: "Import Data",
    key: "display-import-data",
    icon: ListBulletIcon,
  },
  {
    title: "Users",
    key: "import-users",
    icon: UsersIcon,
  },
  {
    title: "Confirm",
    key: "import-confirmation",
    icon: CheckIcon,
  },
];

export const JiraImporterRoot = () => {
  const [currentStep, setCurrentStep] = useState<IJiraIntegrationData>({
    state: "import-configure",
  });
  const [disableTopBarAfter, setDisableTopBarAfter] = useState<TJiraIntegrationSteps | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const methods = useForm<IJiraImporterForm>({
    defaultValues: jiraFormDefaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const isValid = methods.formState.isValid;

  const onSubmit = async (data: IJiraImporterForm) => {
    if (!workspaceSlug) return;

    await jiraImporterService
      .createJiraImporter(workspaceSlug.toString(), data)
      .then(() => {
        mutate(IMPORTER_SERVICES_LIST(workspaceSlug.toString()));
        router.push(`/${workspaceSlug}/settings/import-export`);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const activeIntegrationState = () => {
    const currentElementIndex = integrationWorkflowData.findIndex(
      (i) => i?.key === currentStep?.state
    );

    return currentElementIndex;
  };

  return (
    <div className="flex h-full flex-col space-y-2">
      <Link href={`/${workspaceSlug}/settings/import-export`}>
        <div className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-secondary hover:text-brand-base">
          <div>
            <ArrowLeftIcon className="h-3 w-3" />
          </div>
          <div>Cancel import & go back</div>
        </div>
      </Link>

      <div className="flex h-full flex-col space-y-4 rounded-[10px] border border-brand-base bg-brand-base p-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 flex-shrink-0">
            <Image src={JiraLogo} alt="jira logo" />
          </div>
          <div className="flex h-full w-full items-center justify-center">
            {integrationWorkflowData.map((integration, index) => (
              <React.Fragment key={integration.key}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep({ state: integration.key });
                  }}
                  disabled={
                    index > activeIntegrationState() + 1 ||
                    Boolean(index === activeIntegrationState() + 1 && disableTopBarAfter)
                  }
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand-base ${
                    index <= activeIntegrationState()
                      ? `border-brand-accent bg-brand-accent ${
                          index === activeIntegrationState()
                            ? "border-opacity-100 bg-opacity-100"
                            : "border-opacity-80 bg-opacity-80"
                        }`
                      : "border-brand-base"
                  }`}
                >
                  <integration.icon
                    width="18px"
                    height="18px"
                    color={index <= activeIntegrationState() ? "#ffffff" : "#d1d5db"}
                  />
                </button>
                {index < integrationWorkflowData.length - 1 && (
                  <div
                    key={index}
                    className={`border-b px-7 ${
                      index <= activeIntegrationState() - 1
                        ? `border-brand-accent`
                        : `border-brand-base`
                    }`}
                  >
                    {" "}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="relative h-full w-full pt-6">
          <FormProvider {...methods}>
            <form className="flex h-full w-full flex-col">
              <div className="h-full w-full overflow-y-auto">
                {currentStep.state === "import-configure" && <JiraGetImportDetail />}
                {currentStep.state === "display-import-data" && (
                  <JiraProjectDetail
                    setDisableTopBarAfter={setDisableTopBarAfter}
                    setCurrentStep={setCurrentStep}
                  />
                )}
                {currentStep?.state === "import-users" && <JiraImportUsers />}
                {currentStep?.state === "import-confirmation" && <JiraConfirmImport />}
              </div>

              <div className="-mx-4 mt-4 flex justify-end gap-4 border-t border-brand-base p-4 pb-0">
                {currentStep?.state !== "import-configure" && (
                  <SecondaryButton
                    onClick={() => {
                      const currentElementIndex = integrationWorkflowData.findIndex(
                        (i) => i?.key === currentStep?.state
                      );
                      setCurrentStep({
                        state: integrationWorkflowData[currentElementIndex - 1]?.key,
                      });
                    }}
                  >
                    Back
                  </SecondaryButton>
                )}
                <PrimaryButton
                  disabled={
                    disableTopBarAfter === currentStep?.state ||
                    !isValid ||
                    methods.formState.isSubmitting
                  }
                  onClick={() => {
                    const currentElementIndex = integrationWorkflowData.findIndex(
                      (i) => i?.key === currentStep?.state
                    );

                    if (currentElementIndex === integrationWorkflowData.length - 1) {
                      methods.handleSubmit(onSubmit)();
                    } else {
                      setCurrentStep({
                        state: integrationWorkflowData[currentElementIndex + 1]?.key,
                      });
                    }
                  }}
                >
                  {currentStep?.state === "import-confirmation" ? "Confirm & Import" : "Next"}
                </PrimaryButton>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};
