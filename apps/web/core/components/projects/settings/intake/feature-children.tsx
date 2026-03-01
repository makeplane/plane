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

import { observer } from "mobx-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { IProject } from "@plane/types";
// components
import { SettingsHeading } from "@/components/settings/heading";
// plane web imports
import { INTAKE_FEATURES_LIST, INTAKE_RESPONSIBILITY_LIST } from "@/constants/project/settings/features";
// hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import IntakeSubFeatures from "./intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";
import IntakeResponsibility from "./intake-responsibility";

type Props = {
  currentProjectDetails: IProject;
  workspaceSlug: string;
};
export const IntakeFeatureChildren = observer(function IntakeFeatureChildren({
  currentProjectDetails,
  workspaceSlug,
}: Props) {
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  return (
    <>
      <IntakeResponsibility projectId={currentProjectDetails?.id} featureList={INTAKE_RESPONSIBILITY_LIST} />
      <div className="mt-12">
        <SettingsHeading title="Intake sources" variant="h6" />
        <div className="mt-4 px-4 rounded-lg border transition-all border-subtle bg-layer-2">
          {isEmailEnabled || isFormEnabled ? (
            <IntakeSubFeatures projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
          ) : (
            <IntakeSubFeaturesUpgrade projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
          )}
        </div>
      </div>
    </>
  );
});
