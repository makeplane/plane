/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ToastProvider } from "@makeplane/propel/components/toast";
import { CloseOutline } from "@makeplane/propel/icons";
import type { ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { toastManager } from "./toast-manager";

export type PlaneToastProviderProps = {
  children?: ReactNode;
};

/**
 * Mounts the toast viewport once, near the app root, and binds it to the shared {@link toastManager}
 * so the imperative `setToast` / `setPromiseToast` helpers reach it from anywhere. `ToastProvider`
 * renders the portal, viewport and toast list itself — nothing else needs mounting here.
 */
export function PlaneToastProvider({ children }: PlaneToastProviderProps) {
  // plane hooks
  const { t } = useTranslation();

  return (
    <ToastProvider
      toastManager={toastManager}
      close={<IconButton variant="ghost" size="xs" aria-label={t("close")} icon={<PropelIcon icon={CloseOutline} />} />}
    >
      {children}
    </ToastProvider>
  );
}
PlaneToastProvider.displayName = "blocks.PlaneToastProvider";
