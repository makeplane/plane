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

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import type { UseTourParams, UseTourReturn } from "@plane/types";
import type { TTourStep } from "@plane/propel/tour";
import { preloadTourAssets } from "@plane/propel/tour";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";

/**
 * Custom hook to manage tour state and persistence
 *
 * @example
 * ```tsx
 * const tour = useTour({
 *   tourId: 'workitems',
 *   steps: WORKITEMS_TOUR_STEPS,
 * });
 *
 * return (
 *   <Tour
 *     isOpen={tour.isOpen}
 *     currentStep={tour.currentStep}
 *     steps={tour.translatedSteps}
 *     onClose={tour.closeTour}
 *     onNext={tour.nextStep}
 *     onPrevious={tour.previousStep}
 *   />
 * );
 * ```
 */
export const useTour = (params: UseTourParams): UseTourReturn => {
  const { steps, onComplete, onSkip, onClose, workspaceSlug, storageType = "user_profile", propertyKey } = params;
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const userStore = useUser();
  const workspaceStore = useWorkspace();
  const {
    data: { product_tour },
    updateUserProfile,
  } = useUserProfile();

  // Fetch workspace properties if needed
  useEffect(() => {
    if (storageType === "workspace_properties" && workspaceSlug && workspaceStore) {
      // Check if data is already loaded
      const existingData = workspaceStore.projectNavigationPreferencesMap[workspaceSlug];
      if (!existingData) {
        // Fetch if not loaded
        workspaceStore.fetchProjectNavigationPreferences(workspaceSlug).catch((error) => {
          console.error("Failed to fetch workspace preferences:", error);
        });
      }
    }
  }, [storageType, workspaceSlug, workspaceStore]);

  // Compute completion state from stores (reactive)
  const isCompleted = useMemo(() => {
    if (!storageType) return false;

    if (storageType === "user_profile") {
      return userStore?.userProfile?.data?.is_navigation_tour_completed ?? false;
    }

    if (storageType === "workspace_properties" && workspaceSlug && propertyKey) {
      return product_tour?.[propertyKey] ?? false;
    }

    return false;
  }, [
    storageType,
    userStore?.userProfile?.data?.is_navigation_tour_completed,
    workspaceStore?.projectNavigationPreferencesMap,
    workspaceSlug,
    propertyKey,
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(() => {
    return !isCompleted;
  });

  // Close tour if it gets completed (reactive)
  useEffect(() => {
    if (isCompleted && isOpen) {
      setIsOpen(false);
    }
  }, [isCompleted, isOpen]);

  // Translate steps and apply theme-aware assets
  const translatedSteps = useMemo<TTourStep[]>(
    () =>
      steps.map((step) => ({
        ...step,
        i18n_title: t(step.i18n_title),
        i18n_description: t(step.i18n_description),
        asset: step.asset ? `${step.asset}-${resolvedTheme === "dark" ? "dark" : "light"}.webp` : undefined,
      })),
    [steps, t, resolvedTheme]
  );

  /**
   * Opens the tour
   */
  const openTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Complete the tour and save to backend
   */
  const completeTour = useCallback(async () => {
    try {
      if (storageType === "user_profile") {
        await updateUserProfile({
          is_navigation_tour_completed: true,
        });
      } else if (storageType === "workspace_properties" && workspaceSlug && propertyKey) {
        const currentTours = product_tour || {};
        await updateUserProfile({
          product_tour: {
            ...currentTours,
            [propertyKey]: true,
          },
        });
      }

      setIsOpen(false);
      onComplete?.();
      onClose?.();
    } catch (error) {
      console.error("Failed to complete tour:", error);
      // Store handles rollback, just close the tour
      setIsOpen(false);
    }
  }, [storageType, workspaceSlug, propertyKey, userStore, workspaceStore, onComplete, onClose]);

  /**
   * Advances to the next step or completes the tour if on last step
   */
  const nextStep = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - complete the tour
      await completeTour();
    }
  }, [currentStep, steps.length, completeTour]);

  /**
   * Goes back to the previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Skips/dismisses the tour and marks it as completed
   * (Skip = Complete per user requirement)
   */
  const skipTour = useCallback(async () => {
    try {
      // Skip = Complete: Mark tour as completed in backend
      if (storageType === "user_profile") {
        await updateUserProfile({
          is_navigation_tour_completed: true,
        });
      } else if (storageType === "workspace_properties" && workspaceSlug && propertyKey) {
        const currentTours = product_tour || {};
        await updateUserProfile({
          product_tour: {
            ...currentTours,
            [propertyKey]: true,
          },
        });
      }

      setIsOpen(false);
      onSkip?.();
      onClose?.();
    } catch (error) {
      console.error("Failed to skip tour:", error);
      // Even if API fails, close the tour
      setIsOpen(false);
    }
  }, [storageType, workspaceSlug, propertyKey, userStore, workspaceStore, onSkip, onClose]);

  /**
   * Jumps to a specific step by index
   */
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
      }
    },
    [steps.length]
  );

  return {
    // State
    isOpen,
    currentStep,
    currentStepData: translatedSteps[currentStep] || null,
    translatedSteps,

    // Actions
    openTour,
    closeTour: completeTour,
    nextStep,
    previousStep,
    skipTour,
    goToStep,

    // Computed
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    totalSteps: steps.length,
    isCompleted,
  };
};

/**
 * Hook to preload tour assets when tour is open
 * Preloads all images for the given tour steps in the background
 *
 * @param steps - Array of tour steps with asset URLs
 * @param isOpen - Whether the tour is currently open
 */
export const usePreloadTourAssets = (steps: TTourStep[], isOpen: boolean): void => {
  useEffect(() => {
    if (!isOpen || !steps || steps.length === 0) {
      return;
    }

    // Extract all asset URLs from steps, filtering out undefined values
    const assetUrls = steps.map((step) => step.asset).filter((asset): asset is string => !!asset);

    if (assetUrls.length === 0) {
      return;
    }

    // Preload assets in the background (non-blocking)
    preloadTourAssets(assetUrls).catch((error: unknown) => {
      // Log error but don't block tour functionality
      console.warn("Failed to preload some tour assets:", error);
    });
  }, [steps, isOpen]);
};
