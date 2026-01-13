import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveX } from "lucide-react";
// plane imports
import { PROJECT_AUTOMATION_MONTHS, EUserPermissions, EUserPermissionsLevel, EIconSize } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon, StatePropertyIcon } from "@plane/propel/icons";
import type { IProject } from "@plane/types";
import { CustomSelect, CustomSearchSelect, ToggleSwitch, Loader } from "@plane/ui";
import { SelectMonthModal } from "@/components/automation";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoCloseAutomation = observer(function AutoCloseAutomation(props: Props) {
  const { handleChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [monthModal, setmonthModal] = useState(false);
  // store hooks
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  // const stateGroups = projectStateStore.groupedProjectStates ?? undefined;

  const options = projectStates
    ?.filter((state) => state.group === "cancelled")
    .map((state) => ({
      value: state.id,
      query: state.name,
      content: (
        <div className="flex items-center gap-2">
          <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} />
          {state.name}
        </div>
      ),
    }));

  const multipleOptions = (options ?? []).length > 1;

  const defaultState = projectStates?.find((s) => s.group === "cancelled")?.id || null;

  const selectedOption = projectStates?.find((s) => s.id === (currentProjectDetails?.default_state ?? defaultState));
  const currentDefaultState = projectStates?.find((s) => s.id === defaultState);

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
          <div className="shrink-0 size-10 grid place-items-center rounded-sm bg-layer-2">
            <ArchiveX className="shrink-0 size-4 text-danger-primary" />
          </div>
          <SettingsControlItem
            title={t("project_settings.automations.auto-close.title")}
            description={t("project_settings.automations.auto-close.description")}
            control={
              <ToggleSwitch
                value={autoCloseStatus}
                onChange={() => {
                  if (currentProjectDetails?.close_in === 0) {
                    void handleChange({ close_in: 1, default_state: defaultState });
                  } else {
                    void handleChange({ close_in: 0, default_state: null });
                  }
                }}
                size="sm"
                disabled={!isAdmin}
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
                    <CustomSelect
                      value={currentProjectDetails?.close_in}
                      label={`${currentProjectDetails?.close_in} ${
                        currentProjectDetails?.close_in === 1 ? "month" : "months"
                      }`}
                      onChange={(val: number) => void handleChange({ close_in: val })}
                      input
                      disabled={!isAdmin}
                    >
                      <>
                        {PROJECT_AUTOMATION_MONTHS.map((month) => (
                          <CustomSelect.Option key={month.i18n_label} value={month.value}>
                            {t(month.i18n_label, { months: month.value })}
                          </CustomSelect.Option>
                        ))}
                        <button
                          type="button"
                          className="flex w-full select-none items-center rounded-sm px-1 py-1.5 text-secondary hover:bg-layer-1"
                          onClick={() => setmonthModal(true)}
                        >
                          {t("common.customize_time_range")}
                        </button>
                      </>
                    </CustomSelect>
                  </div>
                </div>

                <div className="ppy sm:py-10 flex w-full items-center justify-between gap-2 px-5 py-4">
                  <div className="w-1/2 text-13 font-medium">
                    {t("project_settings.automations.auto-close.auto_close_status")}
                  </div>
                  <div className="w-1/2">
                    <CustomSearchSelect
                      value={currentProjectDetails?.default_state ?? defaultState}
                      label={
                        <div className="flex items-center gap-2">
                          {selectedOption ? (
                            <StateGroupIcon
                              stateGroup={selectedOption.group}
                              color={selectedOption.color}
                              size={EIconSize.LG}
                            />
                          ) : currentDefaultState ? (
                            <StateGroupIcon
                              stateGroup={currentDefaultState.group}
                              color={currentDefaultState.color}
                              size={EIconSize.LG}
                            />
                          ) : (
                            <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />
                          )}
                          {selectedOption?.name
                            ? selectedOption.name
                            : (currentDefaultState?.name ?? <span className="text-secondary">{t("state")}</span>)}
                        </div>
                      }
                      onChange={(val: string) => void handleChange({ default_state: val })}
                      options={options}
                      disabled={!multipleOptions}
                      input
                    />
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
