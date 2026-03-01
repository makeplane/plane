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
import { NavigationTour as NavigationTourComponent } from "@plane/propel/tour";
import { useTour } from "@/hooks/use-tour";
import { TOUR_CONFIG_MAP, TOUR_TYPES } from "@/constants/tour-config";

/**
 * Navigation Tour Wrapper Component
 *
 * Displays a guided tour of the main navigation features after onboarding is completed.
 * The tour highlights:
 * - Power K search
 * - Inbox/notifications
 * - Projects customization sidebar
 *
 * This tour automatically opens if the user has completed onboarding but hasn't
 * completed the navigation tour yet. Completion status is stored in the user profile
 * (`is_navigation_tour_completed` field).
 *
 * Uses the NavigationTour component from @plane/propel/tour which provides:
 * - Smooth coordinated animations with dots and connecting lines
 * - Automatic positioning with viewport detection
 * - Scroll-to-target functionality
 */
export const NavigationTour = observer(() => {
  const config = TOUR_CONFIG_MAP[TOUR_TYPES.NAVIGATION];

  const tour = useTour({
    tourId: config.tourId,
    steps: config.steps,
    storageType: config.storageType, // "user_profile"
  });

  return (
    <NavigationTourComponent
      isOpen={tour.isOpen}
      currentStep={tour.currentStep}
      steps={tour.translatedSteps}
      onClose={tour.closeTour}
      onNext={tour.nextStep}
      onPrevious={tour.previousStep}
    />
  );
});
