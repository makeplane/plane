"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveRestore } from "lucide-react";
// types
import {
  PROJECT_AUTOMATION_MONTHS,
  EUserPermissions,
  EUserPermissionsLevel,
  PROJECT_SETTINGS_TRACKER_ELEMENTS,
  PROJECT_SETTINGS_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IProject } from "@plane/types";
// ui
import { CustomSelect, Loader, ToggleSwitch } from "@plane/ui";
// component
import { SelectMonthModal } from "@/components/automation";
// constants
// hooks
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { useProject, useUserPermissions } from "@/hooks/store";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

const initialValues: Partial<IProject> = { archive_in: 1 };

export const AutoArchiveAutomation: React.FC<Props> = observer((props) => {
  const { handleChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [monthModal, setmonthModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const { currentProjectDetails } = useProject();

  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    currentProjectDetails?.id
  );

  return (
    <>
      <SelectMonthModal
        type="auto-archive"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 border-b border-custom-border-100 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">
              <ArchiveRestore className="h-4 w-4 flex-shrink-0 text-custom-text-100" />
            </div>
            <div className="">
              <h4 className="text-sm font-medium">{t("project_settings.automations.auto-archive.title")}</h4>
              <p className="text-sm tracking-tight text-custom-text-200">
                {t("project_settings.automations.auto-archive.description")}
              </p>
            </div>
          </div>
          <ToggleSwitch
            value={currentProjectDetails?.archive_in !== 0}
            onChange={async () => {
              if (currentProjectDetails?.archive_in === 0) {
                await handleChange({ archive_in: 1 });
              } else {
                await handleChange({ archive_in: 0 });
              }
              captureElementAndEvent({
                element: {
                  elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.AUTOMATIONS_ARCHIVE_TOGGLE_BUTTON,
                },
                event: {
                  eventName: PROJECT_SETTINGS_TRACKER_EVENTS.auto_archive_workitems,
                  state: "SUCCESS",
                },
              });
            }}
            size="sm"
            disabled={!isAdmin}
          />
        </div>

        {currentProjectDetails ? (
          currentProjectDetails.archive_in !== 0 && (
            <div className="mx-6">
              <div className="flex w-full items-center justify-between gap-2 rounded border border-custom-border-200 bg-custom-background-90 px-5 py-4">
                <div className="w-1/2 text-sm font-medium">
                  {t("project_settings.automations.auto-archive.duration")}
                </div>
                <div className="w-1/2">
                  <CustomSelect
                    value={currentProjectDetails?.archive_in}
                    label={`${currentProjectDetails?.archive_in} ${
                      currentProjectDetails?.archive_in === 1 ? "month" : "months"
                    }`}
                    onChange={(val: number) => {
                      handleChange({ archive_in: val });
                    }}
                    input
                    disabled={!isAdmin}
                  >
                    <>
                      {PROJECT_AUTOMATION_MONTHS.map((month) => (
                        <CustomSelect.Option key={month.i18n_label} value={month.value}>
                          <span className="text-sm">{t(month.i18n_label, { months: month.value })}</span>
                        </CustomSelect.Option>
                      ))}

                      <button
                        type="button"
                        className="flex w-full select-none items-center rounded px-1 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => setmonthModal(true)}
                      >
                        {t("common.customize_time_range")}
                      </button>
                    </>
                  </CustomSelect>
                </div>
              </div>
            </div>
          )
        ) : (
          <Loader className="mx-6">
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});
