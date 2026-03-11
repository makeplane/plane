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
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import type { ExProject } from "@plane/sdk";
import type { IProject } from "@plane/types";
import { Loader } from "@plane/ui";
// components
// plane web components
import { StepperNavigation, Dropdown } from "@/components/importers/ui";
import { RadioInput } from "@/components/estimates/radio-select";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
// plane web types
import type { TImporterDataPayload } from "@/types/importers/jira-server";
import { E_IMPORTER_STEPS } from "@/types/importers/jira-server";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT];

const currentStepKey = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;

export const SelectPlaneProjectRoot = observer(function SelectPlaneProjectRoot() {
  // hooks
  const {
    workspace,
    fetchProjects,
    projectIdsByWorkspaceSlug,
    getProjectById,
    currentStep,
    handleStepper,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
  } = useJiraServerImporter();
  const { t } = useTranslation();

  // states
  const [formData, setFormData] = useState<TFormData>({ projectId: undefined });
  const [importType, setImportType] = useState<"create" | "existing">("create");

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const projects =
    workspaceSlug &&
    ((projectIdsByWorkspaceSlug(workspaceSlug) || [])
      .map((id) => getProjectById(id))
      .filter((project) => project != undefined && !!project.member_role) as IProject[]);
  const isNextButtonDisabled = importType === "existing" && !formData.projectId;

  // handlers
  const handleFormData = (value: string | undefined) => {
    setFormData({ projectId: value });
    // updating the config data
    if (value) {
      const currentProject = getProjectById(value);
      if (currentProject) handleSyncJobConfig("planeProject", currentProject as ExProject);
    }
  };

  const handleImportTypeChange = (type: "create" | "existing") => {
    setImportType(type);
    if (type === "create") {
      handleFormData(undefined);
    } else {
      if (!formData.projectId) {
        handleFormData(undefined);
      }
    }
  };

  const handleOnClickNext = () => {
    // update the data in the context
    handleImporterData(currentStepKey, formData);
    // moving to the next state
    handleStepper("next");
  };

  // setting the form data from the store
  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
      if (!contextData.projectId) {
        setImportType("create");
      } else if (contextData.projectId) {
        setImportType("existing");
      }
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  // fetching the plane projects
  const { isLoading } = useSWR(
    workspaceSlug ? `IMPORTER_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full flex-1 max-h-full min-h-44 overflow-y-auto">
        <RadioInput
          name="import-type"
          options={[
            {
              value: "create",
              label: (
                <div className="flex flex-col gap-1">
                  <div className="text-body-xs-medium">{t("jira_importer.create_project_automatically")}</div>
                  {/* Subtle description for selected state */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${importType === "create" ? "max-h-20 opacity-100 mb-2" : "max-h-0 opacity-0 mt-0"}`}
                  >
                    <p className="text-caption-sm-regular text-tertiary">
                      {t("jira_importer.create_project_automatically_description", {
                        defaultValue: "We will create a new project for you based on the Jira project details.",
                      })}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              value: "existing",
              label: (
                <div className="flex flex-col gap-1">
                  <div className="text-body-xs-medium">{t("jira_importer.import_to_existing_project")}</div>
                  {/* Subtle description and dropdown for selected state */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${importType === "existing" ? "max-h-52 opacity-100 mb-2" : "max-h-0 opacity-0 mt-0"}`}
                  >
                    <div className="space-y-3 pb-2">
                      <p className="text-caption-sm-regular text-tertiary">
                        {t("jira_importer.import_to_existing_project_description", {
                          defaultValue: "Choose an existing project from the dropdown below.",
                        })}
                      </p>
                      {/* Dropdown */}
                      <div onClick={(e) => e.stopPropagation()}>
                        {isLoading && (!projects || projects.length === 0) ? (
                          <Loader>
                            <Loader.Item height="28px" width="100%" />
                          </Loader>
                        ) : (
                          <Dropdown
                            dropdownOptions={(projects || []).map((project) => ({
                              key: project.id,
                              label: project.name,
                              value: project.id,
                              data: project,
                            }))}
                            value={formData.projectId}
                            placeHolder={t("importers.select_service_project", { serviceName: "Plane" })}
                            onChange={(value: string | undefined) => handleFormData(value)}
                            iconExtractor={(option) => (
                              <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                                {option && option?.logo_props ? (
                                  <Logo logo={option?.logo_props} size={14} />
                                ) : (
                                  <ProjectIcon className="w-4 h-4" />
                                )}
                              </div>
                            )}
                            queryExtractor={(option) => option.name || ""}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
          selected={importType}
          onChange={(value: string) => handleImportTypeChange(value as "create" | "existing")}
          fieldClassName="items-start !gap-3"
          buttonClassName="!size-3.5 mt-0.5"
          vertical
        />
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2 justify-between pt-4">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
