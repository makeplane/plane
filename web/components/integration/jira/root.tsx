import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { FormProvider, useForm } from "react-hook-form";
// icons
import { ArrowLeft, Check, List, Settings } from "lucide-react";
// services
import { JiraImporterService } from "services/integrations";
// fetch keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";
// components
import { Button, UserGroupIcon } from "@plane/ui";
import {
  JiraGetImportDetail,
  JiraProjectDetail,
  JiraImportUsers,
  JiraConfirmImport,
  jiraFormDefaultValues,
  TJiraIntegrationSteps,
  IJiraIntegrationData,
} from ".";
// assets
import JiraLogo from "public/services/jira.svg";
// types
import { IJiraImporterForm } from "@plane/types";

const integrationWorkflowData: Array<{
  title: string;
  key: TJiraIntegrationSteps;
  icon: any;
}> = [
  {
    title: "Configure",
    key: "import-configure",
    icon: Settings,
  },
  {
    title: "Import Data",
    key: "display-import-data",
    icon: List,
  },
  {
    title: "Users",
    key: "import-users",
    icon: UserGroupIcon,
  },
  {
    title: "Confirm",
    key: "import-confirmation",
    icon: Check,
  },
];

// services
const jiraImporterService = new JiraImporterService();

export const JiraImporterRoot: React.FC = () => {
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
        router.push(`/${workspaceSlug}/settings/imports`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const activeIntegrationState = () => {
    const currentElementIndex = integrationWorkflowData.findIndex((i) => i?.key === currentStep?.state);

    return currentElementIndex;
  };

  return (
    <div className="mt-4 flex h-full flex-col space-y-2">
      <Link href={`/${workspaceSlug}/settings/imports`}>
        <span className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-custom-text-200 hover:text-custom-text-100">
          <div>
            <ArrowLeft className="h-3 w-3" />
          </div>
          <div>Cancel import & go back</div>
        </span>
      </Link>

      <div className="flex h-full flex-col space-y-4 rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4">
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
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-custom-border-200 ${
                    index <= activeIntegrationState()
                      ? `border-custom-primary bg-custom-primary ${
                          index === activeIntegrationState()
                            ? "border-opacity-100 bg-opacity-100"
                            : "border-opacity-80 bg-opacity-80"
                        }`
                      : "border-custom-border-200"
                  }`}
                >
                  <integration.icon
                    className={`h-5 w-5 ${index <= activeIntegrationState() ? "text-white" : "text-custom-text-400"}`}
                  />
                </button>
                {index < integrationWorkflowData.length - 1 && (
                  <div
                    key={index}
                    className={`border-b px-7 ${
                      index <= activeIntegrationState() - 1 ? `border-custom-primary` : `border-custom-border-200`
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
                  <JiraProjectDetail setDisableTopBarAfter={setDisableTopBarAfter} setCurrentStep={setCurrentStep} />
                )}
                {currentStep?.state === "import-users" && <JiraImportUsers />}
                {currentStep?.state === "import-confirmation" && <JiraConfirmImport />}
              </div>

              <div className="-mx-4 mt-4 flex justify-end gap-4 border-t border-custom-border-200 p-4 pb-0">
                {currentStep?.state !== "import-configure" && (
                  <Button
                    variant="neutral-primary"
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
                  </Button>
                )}
                <Button
                  variant="primary"
                  disabled={disableTopBarAfter === currentStep?.state || !isValid || methods.formState.isSubmitting}
                  onClick={() => {
                    const currentElementIndex = integrationWorkflowData.findIndex((i) => i?.key === currentStep?.state);

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
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};
