import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveRestore } from "lucide-react";
// types
import { PROJECT_AUTOMATION_MONTHS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
// ui
import { CustomSelect, Loader, ToggleSwitch } from "@plane/ui";
// component
import { SelectMonthModal } from "@/components/automation";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

const initialValues: Partial<IProject> = { archive_in: 1 };

export const AutoArchiveAutomation = observer(function AutoArchiveAutomation(props: Props) {
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

  const autoArchiveStatus = useMemo(() => {
    if (currentProjectDetails?.archive_in === undefined) return false;
    return currentProjectDetails.archive_in !== 0;
  }, [currentProjectDetails]);

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
      <div className="flex flex-col gap-4 border-b border-subtle py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded-sm bg-layer-3 p-3">
              <ArchiveRestore className="h-4 w-4 flex-shrink-0 text-primary" />
            </div>
            <div className="">
              <h4 className="text-13 font-medium">{t("project_settings.automations.auto-archive.title")}</h4>
              <p className="text-13 tracking-tight text-tertiary">
                {t("project_settings.automations.auto-archive.description")}
              </p>
            </div>
          </div>
          <ToggleSwitch value={autoArchiveStatus} onChange={handleToggleArchive} size="sm" disabled={!isAdmin} />
        </div>

        {currentProjectDetails ? (
          autoArchiveStatus && (
            <div className="mx-6">
              <div className="flex w-full items-center justify-between gap-2 rounded-sm border border-subtle bg-surface-2 px-5 py-4">
                <div className="w-1/2 text-13 font-medium">
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
                          <span className="text-13">{t(month.i18n_label, { months: month.value })}</span>
                        </CustomSelect.Option>
                      ))}

                      <button
                        type="button"
                        className="flex w-full select-none items-center rounded-sm px-1 py-1.5 text-13 text-secondary hover:bg-layer-1"
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
