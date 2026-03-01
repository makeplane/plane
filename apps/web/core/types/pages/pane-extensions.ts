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

import type { TCommentConfig } from "@plane/editor";
import type {
  INavigationPaneExtensionComponent,
  INavigationPaneExtension as ICoreNavigationPaneExtension,
} from "@/components/pages/navigation-pane";

// EE-specific navigation pane extension data types
export type TCommentsNavigationExtensionData = TCommentConfig & {
  selectedCommentId?: string;
  pendingComment?: {
    selection: { from: number; to: number };
    referenceText?: string;
  };
  onPendingCommentCancel?: () => void;
  onSelectedThreadConsumed?: () => void;
};

// EE Union of all possible navigation pane extension data types
export type TNavigationPaneExtensionData = {
  comments: TCommentsNavigationExtensionData;
};

// EE Navigation pane extension configuration with comment support
export interface INavigationPaneExtension<
  T extends keyof TNavigationPaneExtensionData = keyof TNavigationPaneExtensionData,
> extends Omit<ICoreNavigationPaneExtension<TNavigationPaneExtensionData[T]>, "id" | "data" | "component"> {
  id: T;
  component: INavigationPaneExtensionComponent<TNavigationPaneExtensionData[T]>;
  data: TNavigationPaneExtensionData[T];
}
