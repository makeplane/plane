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

import type { CustomAIBlockNodeViewProps } from "./block-ui";

/**
 * Main entry component for the AI block node view.
 * Renders the widgetCallback from web app if provided, otherwise returns null.
 * The web app's widget is responsible for fetching data and passing it to CustomAIBlockUI.
 */
export function CustomAIBlock(props: CustomAIBlockNodeViewProps) {
  const { extension } = props;
  const { aiBlockWidgetCallback: WidgetCallback } = extension.options;

  // If widget callback is provided, render it (web app handles data fetching)
  if (WidgetCallback) {
    return <WidgetCallback {...props} />;
  }

  // No widget callback - return null (widget callback is required for this component)
  return null;
}
