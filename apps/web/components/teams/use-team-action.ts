/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// local imports
import { getTeamErrorKey } from "./helper";

/** Runs a team action and reports a failure as a toast. Resolves to whether it succeeded. */
export const useTeamAction = () => {
  const { t } = useTranslation();

  return useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        return true;
      } catch (error) {
        setToast({ type: "error", title: t("toast.error"), message: t(getTeamErrorKey(error)) });
        return false;
      }
    },
    [t]
  );
};
