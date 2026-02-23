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

import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export const clientLoader = ({ params }: ClientLoaderFunctionArgs) => {
  const { workspaceSlug, "*": pathSplat } = params;
  const path = pathSplat || "";
  // Redirect /:workspaceSlug/projects/pi-chat/:path* → /:workspaceSlug/projects/ai-chat/:path*
  throw redirect(`/${workspaceSlug}/projects/ai-chat/${path}`);
};

export default function PiChatProjectRedirect() {
  return null;
}
