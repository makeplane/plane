/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DeactivateAccountModal(props: Props) {
  const router = useAppRouter();
  const { isOpen, onClose } = props;
  // hooks
  const { t } = useTranslation();
  const { deactivateAccount, signOut } = useUser();

  // states
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleClose = () => {
    setIsDeactivating(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToast({
          type: "success",
          title: "Success!",
          message: "Account deactivated successfully.",
        });
        signOut();
        router.push("/");
        handleClose();
        return;
      })
      .catch((err: any) => {
        setToast({
          type: "error",
          title: "Error!",
          message: err?.error,
        });
      })
      .finally(() => setIsDeactivating(false));
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleDeleteAccount}
      isSubmitting={isDeactivating}
      title={t("deactivate_your_account")}
      content={t("deactivate_your_account_description")}
      primaryButtonText={{ loading: t("deactivating"), default: t("confirm") }}
      secondaryButtonText={t("cancel")}
    />
  );
}
