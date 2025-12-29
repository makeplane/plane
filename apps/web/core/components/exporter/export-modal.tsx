import React, { useState } from "react";
import { intersection } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IImporterService } from "@plane/types";
// ui
import { Checkbox, CustomSearchSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { ProjectExportService } from "@/services/project";
type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: IUser | null;
  provider: string | string[];
  mutateServices: () => void;
};

const projectExportService = new ProjectExportService();

export const Exporter = observer(function Exporter(props: Props) {
  const { isOpen, handleClose, user, provider, mutateServices } = props;
  // states
  const [exportLoading, setExportLoading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceProjectIds, getProjectById } = useProject();
  const { projectsWithCreatePermissions } = useUser();
  const { t } = useTranslation();

  const wsProjectIdsWithCreatePermisisons = projectsWithCreatePermissions
    ? intersection(workspaceProjectIds, Object.keys(projectsWithCreatePermissions))
    : [];

  const options = wsProjectIdsWithCreatePermisisons?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="text-10 text-secondary flex-shrink-0">{projectDetails?.identifier}</span>
          <span className="truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  const [value, setValue] = React.useState<string[]>([]);
  const [multiple, setMultiple] = React.useState<boolean>(false);
  const onChange = (val: any) => {
    setValue(val);
  };

  async function ExportCSVToMail() {
    setExportLoading(true);
    if (workspaceSlug && user && typeof provider === "string") {
      const payload = {
        provider: provider,
        project: value,
        multiple: multiple,
      };
      await projectExportService
        .csvExport(workspaceSlug, payload)
        .then(() => {
          mutateServices();
          router.push(`/${workspaceSlug}/settings/exports`);
          setExportLoading(false);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("workspace_settings.settings.exports.modal.toasts.success.title"),
            message: t("workspace_settings.settings.exports.modal.toasts.success.message", {
              entity: provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : "",
            }),
          });
        })
        .catch(() => {
          setExportLoading(false);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
          });
        });
    }
  }

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => {
        if (!isSelectOpen) handleClose();
      }}
      position={EModalPosition.CENTER}
      width={EModalWidth.XL}
    >
      <div className="flex flex-col gap-6 gap-y-4 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">
              {t("workspace_settings.settings.exports.modal.title")}{" "}
              {provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : ""}
            </h3>
          </span>
        </div>
        <div>
          <CustomSearchSelect
            value={value ?? []}
            onChange={(val: string[]) => onChange(val)}
            options={options}
            input
            label={
              value && value.length > 0
                ? value
                    .map((projectId) => {
                      const projectDetails = getProjectById(projectId);

                      return projectDetails?.identifier;
                    })
                    .join(", ")
                : "All projects"
            }
            onOpen={() => setIsSelectOpen(true)}
            onClose={() => setIsSelectOpen(false)}
            optionsClassName="max-w-48 sm:max-w-[532px]"
            placement="bottom-end"
            multiple
          />
        </div>
        <div className="flex max-w-min cursor-pointer items-center gap-2">
          <Checkbox checked={multiple} onChange={() => setMultiple(!multiple)} />
          <div className="whitespace-nowrap text-13">
            {t("workspace_settings.settings.exports.export_separate_files")}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={ExportCSVToMail} disabled={exportLoading} loading={exportLoading}>
            {exportLoading
              ? `${t("workspace_settings.settings.exports.exporting")}...`
              : t("workspace_settings.settings.exports.title")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
