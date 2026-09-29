/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export function ArchiveModuleModal(props: Props) {
  const { workspaceSlug, projectId, moduleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getModuleNameById, archiveModule } = useModule();
  const { t } = useTranslation();

  const moduleName = getModuleNameById(moduleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveModule = async () => {
    setIsArchiving(true);
    await archiveModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("module_ui.archive_success_title"),
          message: t("module_ui.archive_success_message"),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/modules`);
        return;
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("module_ui.archive_error"),
        })
      )
      .finally(() => setIsArchiving(false));
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">{t("module_ui.archive_modal_title", { name: moduleName })}</h3>
        <p className="mt-3 text-13 text-secondary">
          {t("module_ui.archive_modal_description")}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" tabIndex={1} onClick={handleArchiveModule} loading={isArchiving}>
            {isArchiving ? t("common.archiving") : t("common.archive")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
