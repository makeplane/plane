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
import { useParams } from "next/navigation";
import { Popover } from "@headlessui/react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
// plane web components
import { INTAKE_FEATURES_LIST } from "@/constants/project/settings/features";
// hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local components
import IntakeSubFeatures from "./intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";

const IntakeTooltip = observer(function IntakeTooltip({ projectId }: { projectId: string }) {
  const { workspaceSlug } = useParams();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  return (
    <div className="p-2">
      <div className="flex justify-between">
        <span className="text-13 font-semibold"> Intake info</span>

        <Popover.Button>
          <CloseIcon height={16} width={16} />
        </Popover.Button>
      </div>
      {isEmailEnabled || isFormEnabled ? (
        <IntakeSubFeatures
          allowEdit={false}
          showDefault={false}
          projectId={projectId}
          featureList={INTAKE_FEATURES_LIST}
          isTooltip
        />
      ) : (
        <IntakeSubFeaturesUpgrade
          showDefault={false}
          projectId={projectId}
          featureList={INTAKE_FEATURES_LIST}
          isTooltip
        />
      )}
    </div>
  );
});

export default IntakeTooltip;
