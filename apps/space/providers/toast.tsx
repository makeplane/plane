/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createToastManager, ToastProvider } from "@makeplane/propel/components/toast";
import type { ToastVariant } from "@makeplane/propel/components/toast";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { CloseOutline } from "@makeplane/propel/icons";

// Thin wrapper over @makeplane/propel's toast manager to keep the call-site API stable.
export enum TOAST_TYPE {
  SUCCESS = "success",
  ERROR = "error",
  INFO = "info",
  WARNING = "warning",
}

const TYPE_TO_VARIANT: Record<TOAST_TYPE, ToastVariant> = {
  [TOAST_TYPE.SUCCESS]: "success",
  [TOAST_TYPE.ERROR]: "danger",
  [TOAST_TYPE.INFO]: "info",
  [TOAST_TYPE.WARNING]: "warning",
};

const toastManager = createToastManager();

type SetToastProps = {
  type: TOAST_TYPE;
  title: string;
  message?: string;
};

export const setToast = (props: SetToastProps) =>
  toastManager.add({
    title: props.title,
    description: props.message,
    data: { variant: TYPE_TO_VARIANT[props.type] },
  });

export function ToastWithTheme() {
  return (
    <ToastProvider
      toastManager={toastManager}
      close={
        <IconButton variant="ghost" size="sm" aria-label="Close notification" icon={<Icon icon={CloseOutline} />} />
      }
    />
  );
}
