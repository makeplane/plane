/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AutoCloseOutline, StateOutline } from "@makeplane/propel/icons";
// plane imports
import { PROJECT_AUTOMATION_MONTHS, EUserPermissions, EUserPermissionsLevel, EIconSize } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/blocks/icons";
import type { IProject, IState } from "@plane/types";
import { Switch } from "@makeplane/propel/components/switch";
import { Select } from "@plane/blocks/select";
import { Loader } from "@plane/blocks/skeleton";
import { SelectMonthModal } from "@/components/automation";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

type TAutomationMonthOption = {
  id: string;
  label: string;
};

export const AutoCloseAutomation = observer(function AutoCloseAutomation(props: Props) {
  const { handleChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [monthModal, setmonthModal] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  // store hooks
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  // const stateGroups = projectStateStore.groupedProjectStates ?? undefined;

  const options = (projectStates ?? []).filter((state) => state.group === "cancelled");

  const multipleOptions = (options ?? []).length > 1;

  const defaultState = projectStates?.find((s) => s.group === "cancelled")?.id || null;

  const selectedOption = projectStates?.find((s) => s.id === (currentProjectDetails?.default_state ?? defaultState));
  const currentDefaultState = projectStates?.find((s) => s.id === defaultState);
  // The trigger falls back to the project's own cancelled state when nothing is stored yet.
  const triggerState = selectedOption ?? currentDefaultState;

  // `close_in` is not constrained to the presets — the "Customize time range" modal writes any
  // month count — and `Select` names its trigger from the option list, so a value outside the
  // presets has to join the list or the trigger reads empty.
  const closeIn = currentProjectDetails?.close_in;
  const monthOptions = useMemo<TAutomationMonthOption[]>(() => {
    const months = PROJECT_AUTOMATION_MONTHS.map((month) => month.value);
    if (closeIn !== undefined && !months.includes(closeIn)) months.push(closeIn);
    months.sort((a, b) => a - b);
    return months.map((month) => ({
      id: String(month),
      label: t("workspace_projects.common.months_count", { months: month }),
    }));
  }, [t, closeIn]);
  const selectedMonthOption = monthOptions.find((option) => option.id === String(closeIn)) ?? null;

  const initialValues: Partial<IProject> = {
    close_in: 1,
    default_state: defaultState,
  };

  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    currentProjectDetails?.id
  );

  const autoCloseStatus = useMemo(() => {
    if (currentProjectDetails?.close_in === undefined) return false;
    return currentProjectDetails.close_in !== 0;
  }, [currentProjectDetails]);

  return (
    <>
      <SelectMonthModal
        type="auto-close"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-layer-2">
            <AutoCloseOutline className="size-4 shrink-0 text-danger-primary" />
          </div>
          <SettingsControlItem
            title={t("project_settings.automations.auto-close.title")}
            description={t("project_settings.automations.auto-close.description")}
            control={
              <Switch
                size="sm"
                checked={autoCloseStatus}
                onCheckedChange={() => {
                  if (currentProjectDetails?.close_in === 0) {
                    void handleChange({ close_in: 1, default_state: defaultState });
                  } else {
                    void handleChange({ close_in: 0, default_state: null });
                  }
                }}
                disabled={!isAdmin}
                aria-label={t("project_settings.automations.auto-close.title")}
              />
            }
          />
        </div>

        {currentProjectDetails ? (
          autoCloseStatus && (
            <div className="ml-13">
              <div className="flex flex-col rounded-sm border border-subtle bg-surface-2">
                <div className="flex w-full items-center justify-between gap-2 px-5 py-4">
                  <div className="w-1/2 text-13 font-medium">
                    {t("project_settings.automations.auto-close.duration")}
                  </div>
                  <div className="w-1/2">
                    <Select<TAutomationMonthOption>
                      getValues={() => monthOptions}
                      value={selectedMonthOption}
                      onChange={(id) => void handleChange({ close_in: Number(id) })}
                      getOptionValue={(option) => option.id}
                      getOptionLabel={(option) => option.label}
                      showSearch={false}
                      pinSelected={false}
                      disabled={!isAdmin}
                      open={isMonthSelectOpen}
                      onOpenChange={setIsMonthSelectOpen}
                      footer={
                        <button
                          type="button"
                          className="flex w-full items-center rounded-sm px-1 py-1.5 text-secondary select-none hover:bg-layer-1"
                          onClick={() => {
                            setIsMonthSelectOpen(false);
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

                <div className="ppy flex w-full items-center justify-between gap-2 px-5 py-4 sm:py-10">
                  <div className="w-1/2 text-13 font-medium">
                    {t("project_settings.automations.auto-close.auto_close_status")}
                  </div>
                  <div className="w-1/2">
                    <Select<IState>
                      getValues={() => options}
                      value={selectedOption ?? null}
                      onChange={(val) => void handleChange({ default_state: val })}
                      disabled={!multipleOptions}
                      getOptionValue={(state) => state.id}
                      getOptionLabel={(state) => state.name}
                      getOptionIcon={(state) => (
                        <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} />
                      )}
                      pinSelected={false}
                      placeholder={t("state")}
                    >
                      <Select.Trigger variant="select-md">
                        {triggerState ? (
                          <>
                            <StateGroupIcon
                              stateGroup={triggerState.group}
                              color={triggerState.color}
                              size={EIconSize.LG}
                            />
                            <span className="grow truncate">{triggerState.name}</span>
                          </>
                        ) : (
                          <>
                            <StateOutline className="h-3.5 w-3.5 text-secondary" />
                            <span className="grow truncate text-secondary">{t("state")}</span>
                          </>
                        )}
                      </Select.Trigger>
                    </Select>
                  </div>
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
