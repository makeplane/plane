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

import { useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { PlaneLockup } from "@plane/propel/icons";
// hooks
import { useUser } from "@/hooks/store/user";
import { redirectIfUserIsNotOnboarded, requireAuthenticatedUser } from "@/lib/middleware/auth-client-middleware";
// local imports
import type { Route } from "./+types/page";
import { ESupportedFeatures, WorkspaceSelector } from "./workspace-selector";

const NOT_FOUND_CLASSNAME = "flex items-center justify-center h-full text-primary text-16 font-medium";

export const clientMiddleware = [requireAuthenticatedUser, redirectIfUserIsNotOnboarded];

function isValidFeature(feature: string): feature is ESupportedFeatures {
  return Object.values(ESupportedFeatures).includes(feature as ESupportedFeatures);
}

function WorkspacePickerPage({ params }: Route.ComponentProps) {
  // router
  const { feature, identifier } = params;
  // hooks
  const { data: currentUser } = useUser();
  // derived values
  const isFeatureSupported = isValidFeature(feature);

  const content = useMemo(() => {
    if (!isFeatureSupported) {
      return <div className={NOT_FOUND_CLASSNAME}>Invalid feature</div>;
    }
    if (typeof identifier !== "string") {
      return <div className={NOT_FOUND_CLASSNAME}>Invalid identifier</div>;
    }
    return <WorkspaceSelector feature={feature} identifier={identifier} />;
  }, [feature, identifier, isFeatureSupported]);

  return (
    <div className="flex flex-col h-full gap-y-2 pb-20">
      <div className="flex items-center justify-between p-10 lg:px-20 xl:px-36">
        <Link href="/" className="bg-surface-1 px-3">
          <PlaneLockup className="h-7 w-auto text-primary" />
        </Link>
        <div className="text-13 text-primary">{currentUser?.email}</div>
      </div>
      {content}
    </div>
  );
}

export default observer(WorkspacePickerPage);
