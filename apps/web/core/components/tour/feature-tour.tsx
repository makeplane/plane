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
import { useParams } from "react-router";
import { Tour } from "@plane/propel/tour";
import { useTour, usePreloadTourAssets } from "@/hooks/use-tour";
import { TOUR_CONFIG_MAP } from "@/constants/tour-config";
import type { TTourType } from "@/constants/tour-config";

type FeatureTourProps = {
  tourType: TTourType;
};

export const FeatureTour = observer(({ tourType }: FeatureTourProps) => {
  const { workspaceSlug } = useParams();
  const config = TOUR_CONFIG_MAP[tourType];

  const tour = useTour({
    tourId: config.tourId,
    steps: config.steps,
    workspaceSlug: config.storageType === "workspace_properties" ? workspaceSlug : undefined,
    storageType: config.storageType,
    propertyKey: config.propertyKey,
  });

  // Preload all tour assets when tour is open
  usePreloadTourAssets(tour.translatedSteps, tour.isOpen);

  return (
    <Tour
      isOpen={tour.isOpen}
      currentStep={tour.currentStep}
      steps={tour.translatedSteps}
      onClose={tour.closeTour}
      onNext={tour.nextStep}
      onPrevious={tour.previousStep}
    />
  );
});
