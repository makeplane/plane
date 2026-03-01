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

// ee components
import { IdentityRoot } from "@/components/workspace/settings/identity/root";
// types
import type { Route } from "./+types/page";

export default function IdentityPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;

  return <IdentityRoot workspaceSlug={workspaceSlug} />;
}
