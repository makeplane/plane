/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { intersection } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { IUser, IImporterService } from "@plane/types";
// ui
import { Checkbox } from "@makeplane/propel/components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// components
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
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

  const wsProjectIdsWithCreatePermissionsSet = new Set(wsProjectIdsWithCreatePermisisons);

  const [value, setValue] = useState<string[]>([]);
  const [multiple, setMultiple] = useState<boolean>(false);

  async function ExportCSVToMail() {
    setExportLoading(true);
    if (workspaceSlug && user && typeof provider === "string") {
      const payload = {
        provider: provider,
        project: value,
        multiple: multiple,
      };
      try {
        await projectExportService.csvExport(workspaceSlug, payload);
        mutateServices();
        router.push(`/${workspaceSlug}/settings/exports`);
        setExportLoading(false);
        setToast({
          type: "success",
          title: t("workspace_settings.settings.exports.modal.toasts.success.title"),
          message: t("workspace_settings.settings.exports.modal.toasts.success.message", {
            entity: provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : "",
          }),
        });
      } catch {
        setExportLoading(false);
        setToast({
          type: "error",
          title: t("error"),
          message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
        });
      }
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="sm">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>
                {t("workspace_settings.settings.exports.modal.title")}{" "}
                {provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : ""}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="flex flex-col gap-4">
              <ProjectSelect
                multiple
                projectList="all"
                value={value}
                onChange={setValue}
                variant="select-md"
                filterOption={(projectId) => wsProjectIdsWithCreatePermissionsSet.has(projectId)}
                // Preserve selected ids even if their project is unloaded or removed from the available options.
                resolveProject={(projectId) => {
                  const project = getProjectById(projectId);
                  if (!project) return { id: projectId, name: projectId };
                  return {
                    id: project.id,
                    name: project.name,
                    identifier: project.identifier,
                    logo_props: project.logo_props,
                  };
                }}
                placeholder="All projects"
                className="w-full"
              />
              <Checkbox
                label={t("workspace_settings.settings.exports.export_separate_files")}
                stretch="auto"
                checked={multiple}
                onCheckedChange={setMultiple}
              />
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="sm" stretch="auto" onClick={handleClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => void ExportCSVToMail()}
            disabled={exportLoading}
            loading={exportLoading}
            label={
              exportLoading
                ? `${t("workspace_settings.settings.exports.exporting")}...`
                : t("workspace_settings.settings.exports.title")
            }
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
