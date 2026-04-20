/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  handleDiscard: () => void;
};

export const EditRoleDiscardChangesModal = observer(function EditRoleDiscardChangesModal({
  isOpen,
  handleClose,
  handleDiscard,
}: Props) {
  // translation
  const { t } = useTranslation();

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-h5-medium">
          {t("workspace_settings.settings.roles_and_permissions.discard_changes_modal.title")}
        </h3>
        <p className="text-body-sm-regular text-tertiary">
          {t("workspace_settings.settings.roles_and_permissions.discard_changes_modal.description")}
        </p>
      </div>
      <div className="px-4 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t-[0.5px] border-subtle">
        <Button
          variant="secondary"
          onClick={() => {
            handleDiscard();
            handleClose();
          }}
        >
          {t("workspace_settings.settings.roles_and_permissions.discard_changes_modal.cancel")}
        </Button>
        <Button variant="primary" onClick={handleClose}>
          {t("workspace_settings.settings.roles_and_permissions.discard_changes_modal.confirm")}
        </Button>
      </div>
    </ModalCore>
  );
});
