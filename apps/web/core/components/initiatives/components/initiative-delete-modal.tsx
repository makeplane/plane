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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";

interface IInitiativeDelete {
  initiative: TInitiative;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
}

export const InitiativeDeleteModal = observer(function InitiativeDeleteModal(props: IInitiativeDelete) {
  const { isOpen, handleClose, initiative, workspaceSlug } = props;
  // states
  const [loader, setLoader] = useState(false);
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const {
    initiative: { deleteInitiative },
  } = useInitiatives();
  // router
  const router = useAppRouter();
  const { initiativeId } = useParams();

  const formSubmit = async () => {
    if (!initiative) return;

    setLoader(true);
    try {
      await deleteInitiative(workspaceSlug, initiative.id)
        .then(() => {
          if (initiativeId) router.push(`/${workspaceSlug}/initiatives`);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("initiatives.toast.delete.success"),
          });
        })
        .catch((errors) => {
          const isPermissionError = errors?.error === "You don't have the required permissions.";
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : {
                i18n_title: "toast.success",
                i18n_message: "initiatives.toast.delete.error",
              };
          setToast({
            title: t(currentError.i18n_title),
            type: TOAST_TYPE.ERROR,
            message: currentError.i18n_message ? t(currentError.i18n_message) : undefined,
          });
        })
        .finally(() => handleClose());
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });
    }

    setLoader(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("initiatives.delete_initiative")}
      content={
        <>
          {/* TODO: Add translation here */}
          Are you sure you want to delete Initiative{' "'}
          <span className="break-words font-medium text-primary">{initiative?.name}</span>
          {'"'}? All of the data related to the initiative will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
