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

import { useCallback } from "react";
import { LogOut, Mails } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

/**
 * Account commands - Account related commands
 */
export const usePowerKAccountCommands = (): TPowerKCommandConfig[] => {
  // navigation
  const router = useAppRouter();
  // store
  const { signOut } = useUser();
  // translation
  const { t } = useTranslation();

  const handleSignOut = useCallback(() => {
    signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [signOut]);

  return [
    {
      id: "workspace_invites",
      type: "action",
      group: "account",
      i18n_title: "power_k.account_actions.workspace_invites",
      icon: Mails,
      action: () => router.push("/invitations"),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "sign_out",
      type: "action",
      group: "account",
      i18n_title: "power_k.account_actions.sign_out",
      icon: LogOut,
      action: handleSignOut,
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
