/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { RestoreOutline } from "@makeplane/propel/icons";
// plane imports
import { PROJECT_AUTOMATION_MONTHS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
import { Switch } from "@makeplane/propel/components/switch";
import { Select } from "@plane/blocks/select";
import { Loader } from "@plane/blocks/skeleton";
// component
import { SelectMonthModal } from "@/components/automation";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

const initialValues: Partial<IProject> = { archive_in: 1 };

type TAutomationMonthOption = {
  id: string;
  label: string;
};

export const AutoArchiveAutomation = observer(function AutoArchiveAutomation(props: Props) {
  const { handleChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [monthModal, setmonthModal] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
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

  const autoArchiveStatus = useMemo(() => {
    if (currentProjectDetails?.archive_in === undefined) return false;
    return currentProjectDetails.archive_in !== 0;
  }, [currentProjectDetails]);

  // `archive_in` is not constrained to the presets — the "Customize time range" modal writes any
  // month count — and `Select` names its trigger from the option list, so a value outside the
  // presets has to join the list or the trigger reads empty.
  const archiveIn = currentProjectDetails?.archive_in;
  const monthOptions = useMemo<TAutomationMonthOption[]>(() => {
    const months = PROJECT_AUTOMATION_MONTHS.map((month) => month.value);
    if (archiveIn !== undefined && !months.includes(archiveIn)) months.push(archiveIn);
    months.sort((a, b) => a - b);
    return months.map((month) => ({
      id: String(month),
      label: t("workspace_projects.common.months_count", { months: month }),
    }));
  }, [t, archiveIn]);
  const selectedMonthOption = monthOptions.find((option) => option.id === String(archiveIn)) ?? null;

  const handleToggleArchive = async () => {
    if (currentProjectDetails?.archive_in === 0) {
      await handleChange({ archive_in: 1 });
    } else {
      await handleChange({ archive_in: 0 });
    }
  };

  return (
    <>
      <SelectMonthModal
        type="auto-archive"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 border-b border-subtle py-2">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-layer-2">
            <RestoreOutline className="size-4 shrink-0 text-primary" />
          </div>
          <SettingsControlItem
            title={t("project_settings.automations.auto-archive.title")}
            description={t("project_settings.automations.auto-archive.description")}
            control={
              <Switch
                size="sm"
                checked={autoArchiveStatus}
                onCheckedChange={handleToggleArchive}
                disabled={!isAdmin}
                aria-label={t("project_settings.automations.auto-archive.title")}
              />
            }
          />
        </div>
        {currentProjectDetails ? (
          autoArchiveStatus && (
            <div className="ml-13">
              <div className="flex w-full items-center justify-between gap-2 rounded-sm border border-subtle bg-surface-2 px-5 py-4">
                <div className="w-1/2 text-13 font-medium">
                  {t("project_settings.automations.auto-archive.duration")}
                </div>
                <div className="w-1/2">
                  <Select<TAutomationMonthOption>
                    getValues={() => monthOptions}
                    value={selectedMonthOption}
                    onChange={(id) => void handleChange({ archive_in: Number(id) })}
                    getOptionValue={(option) => option.id}
                    getOptionLabel={(option) => option.label}
                    showSearch={false}
                    pinSelected={false}
                    disabled={!isAdmin}
                    open={isSelectOpen}
                    onOpenChange={setIsSelectOpen}
                    footer={
                      <button
                        type="button"
                        className="flex w-full items-center rounded-sm px-1 py-1.5 text-13 text-secondary select-none hover:bg-layer-1"
                        onClick={() => {
                          setIsSelectOpen(false);
                          setmonthModal(true);
                        }}
                      >
                        {t("common.customize_time_range")}
                      </button>
                    }
                  >
                    <Select.Trigger variant="select-md" disabled={!isAdmin}>
                      <Select.Value />
                    </Select.Trigger>
                  </Select>
                </div>
              </div>
            </div>
          )
        ) : (
          <Loader className="ml-13">
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});
