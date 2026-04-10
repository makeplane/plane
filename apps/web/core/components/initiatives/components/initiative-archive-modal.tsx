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

import { useState } from "react";
// plane imports
import { INITIATIVE_ERROR_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { isApiError } from "@plane/utils";
// plane web hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// types
import type { TInitiative } from "@/types/initiative";

type Props = {
  initiative: TInitiative;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
};

export function InitiativeArchiveModal(props: Props) {
  const { initiative, isOpen, handleClose, workspaceSlug } = props;
  const { t } = useTranslation();
  // states
  const [isArchiving, setIsArchiving] = useState(false);

  const {
    initiative: { archiveInitiative },
  } = useInitiatives();

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveInitiative = async () => {
    try {
      setIsArchiving(true);
      await archiveInitiative(workspaceSlug, initiative.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("initiatives.toast.archive.success"),
      });
      onClose();
    } catch (err) {
      const code = isApiError(err) ? err.code : undefined;
      const i18nMessage = (code && INITIATIVE_ERROR_DETAILS[code]?.i18n_message) ?? "initiatives.toast.archive.error";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t(i18nMessage),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">
          {t("initiatives.archive_initiative")} {initiative?.name}
        </h3>
        <p className="mt-3 text-13 text-secondary">{t("initiatives.archive_confirm_message")}</p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" tabIndex={1} onClick={handleArchiveInitiative} loading={isArchiving}>
            {isArchiving ? t("common.archiving") : t("common.archive")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
