/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
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
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;

  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  archive: boolean;
};

export function ArchiveRestoreProjectModal(props: Props) {
  const { t } = useTranslation();

  const { workspaceSlug, projectId, isOpen, onClose, archive } = props;
  // router
  const router = useAppRouter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectById, archiveProject, restoreProject } = useProject();

  const projectDetails = getProjectById(projectId);
  if (!projectDetails) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleArchiveProject = async () => {
    setIsLoading(true);
    await archiveProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: "success",
          title: t("issue.archive.success.label"),
          message: t("web_ui.dynamic_value0_has_been_archived_successfully", { value0: projectDetails.name }),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.project_could_not_be_archived_please_try_again"),
        })
      )
      .finally(() => setIsLoading(false));
  };

  const handleRestoreProject = async () => {
    setIsLoading(true);
    await restoreProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: "success",
          title: t("issue.restore.success.title"),
          message: t("web_ui.dynamic_you_can_find_value0_in_your_projects", { value0: projectDetails.name }),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.project_could_not_be_restored_please_try_again"),
        })
      )
      .finally(() => setIsLoading(false));
  };

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
                {archive ? t("archive") : t("restore")} {projectDetails.name}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <p className="text-13 text-secondary">
              {archive
                ? "This project and its work items, cycles, modules, and pages will be archived. Its work items won't appear in search. Only project admins can restore the project."
                : t(
                    "web_ui.restoring_a_project_will_activate_it_and_make_it_visible_to_all_members_of_the_project_are"
                  )}
            </p>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={onClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={
              archive
                ? isLoading
                  ? t("common.archiving")
                  : t("archive")
                : isLoading
                  ? t("web_ui.restoring")
                  : t("restore")
            }
            onClick={archive ? handleArchiveProject : handleRestoreProject}
            loading={isLoading}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
