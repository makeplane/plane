/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// types
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IProject } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

// type
type TJoinProjectModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  project: IProject;
  handleClose: () => void;
};

export function JoinProjectModal(props: TJoinProjectModalProps) {
  const { handleClose, isOpen, project, workspaceSlug } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);
  // store hooks
  const { joinProject } = useUserPermissions();
  // router
  const router = useAppRouter();

  const handleJoin = async () => {
    setIsJoiningLoading(true);

    await joinProject(workspaceSlug, project.id)
      .then(() => {
        router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
        handleClose();
        return;
      })
      .catch(() => {
        console.error("Error joining project");
      })
      .finally(() => {
        setIsJoiningLoading(false);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="space-y-5 px-5 py-8 sm:p-6">
        <h3 className="text-16 leading-6 font-medium text-primary">{t("project_components.join_modal.title")}</h3>
        <p>
          {t("project_components.join_modal.description", { name: project?.name })}
        </p>
        <div className="space-y-3" />
      </div>
      <div className="mt-5 flex justify-end gap-2 px-5 pb-8 sm:px-6 sm:pb-6">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="lg" tabIndex={1} type="submit" onClick={handleJoin} loading={isJoiningLoading}>
          {isJoiningLoading ? t("project_components.shared.joining") : t("project_components.join_modal.join_project")}
        </Button>
      </div>
    </ModalCore>
  );
}
