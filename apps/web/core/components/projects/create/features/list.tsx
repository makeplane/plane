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
import type { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IProject, TProjectFeaturesList } from "@plane/types";
// components
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { UpgradeBadge } from "@/components/workspace/upgrade-badge";
// constants
import { PROJECT_FEATURES_LIST } from "@/constants/project/settings";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import { ProjectFeatureToggle } from "./toggle";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
  isCreateModal?: boolean;
};

export const ProjectFeaturesList = observer(function ProjectFeaturesList(props: Props) {
  const { workspaceSlug, projectId, isAdmin, isCreateModal } = props;
  // store hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { getProjectById, updateProject } = useProject();
  const { toggleProjectFeatures, isProjectFeatureEnabled } = useProjectAdvanced();
  // Feature flag mapping per project feature property
  const FEATURE_FLAG_BY_PROPERTY: Record<string, keyof typeof E_FEATURE_FLAGS | undefined> = {
    is_time_tracking_enabled: "ISSUE_WORKLOG",
    is_milestone_enabled: "MILESTONES",
    // Add more property-to-flag mappings here as needed
  };
  // Call hooks at top level
  const isWorklogEnabled = useFlag(workspaceSlug, "ISSUE_WORKLOG");
  const isMilestonesEnabled = useFlag(workspaceSlug, "MILESTONES");
  // Precompute known flags once
  const featureStatusByFlagKey: Partial<
    Record<keyof typeof E_FEATURE_FLAGS, { isEnabled: boolean; shouldHideIfDisabled: boolean }>
  > = {
    ISSUE_WORKLOG: {
      isEnabled: isWorklogEnabled,
      shouldHideIfDisabled: false,
    },
    MILESTONES: {
      isEnabled: isMilestonesEnabled,
      shouldHideIfDisabled: true,
    },
  };
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const FEATURES_LIST: (keyof TProjectFeaturesList)[] = ["is_milestone_enabled", "is_time_tracking_enabled"];

  const handleSubmit = async (featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // making the request to update the project feature
    let settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };

    // TODO: fix the type error
    // eslint-disable-next-line promise/always-return
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload).then(() => {});

    let updatePromise = updateProjectPromise;

    if (FEATURES_LIST.includes(featureProperty as keyof TProjectFeaturesList)) {
      settingsPayload = {
        [featureProperty]: !isProjectFeatureEnabled(projectId, featureProperty as keyof TProjectFeaturesList),
      };
      const toggleProjectFeaturesPromise = toggleProjectFeatures(workspaceSlug, projectId, settingsPayload);
      updatePromise = toggleProjectFeaturesPromise;
    }

    setPromiseToast(updatePromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  const isFeatureEnabled = (property: string): boolean => {
    if (FEATURES_LIST.includes(property as keyof TProjectFeaturesList)) {
      return isProjectFeatureEnabled(projectId, property as keyof TProjectFeaturesList);
    }
    return Boolean(currentProjectDetails?.[property as keyof IProject]);
  };
  if (!currentUser) return <></>;

  return (
    <div className="flex flex-col gap-y-12">
      {Object.entries(PROJECT_FEATURES_LIST).map(([featureSectionKey, feature]) => (
        <div key={featureSectionKey} className="flex flex-col gap-y-4">
          <SettingsHeading title={t(feature.key)} description={t(`${feature.key}_description`)} />
          {Object.entries(feature.featureList).map(([featureItemKey, featureItem]) => {
            const flagKey = FEATURE_FLAG_BY_PROPERTY[featureItem.property];

            const featureStatus = flagKey ? featureStatusByFlagKey[flagKey] : undefined;

            if (featureStatus && featureStatus.shouldHideIfDisabled && !featureStatus.isEnabled) {
              return null;
            }

            const isEnabled = featureStatus ? Boolean(featureStatus.isEnabled) : true;

            return (
              <div key={featureItemKey} role="button">
                <SettingsBoxedControlItem
                  title={
                    <span className="flex items-center gap-2">
                      <span>
                        Enable <span className="lowercase">{t(featureItem.key)}</span>
                      </span>
                      {featureItem.isPro && (
                        <Tooltip tooltipContent="Pro feature" position="top">
                          <UpgradeBadge flag={flagKey} className="rounded" />
                        </Tooltip>
                      )}
                    </span>
                  }
                  description={t(`${featureItem.key}_description`)}
                  control={
                    <ProjectFeatureToggle
                      featureItem={featureItem}
                      value={isFeatureEnabled(featureItem.property)}
                      handleSubmit={handleSubmit}
                      disabled={!isEnabled || !isAdmin}
                      isCreateModal={isCreateModal}
                    />
                  }
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});
