import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IProject } from "@plane/types";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { UpgradeBadge } from "@/plane-web/components/workspace/upgrade-badge";
import { PROJECT_FEATURES_LIST } from "@/plane-web/constants/project/settings";
// local imports
import { ProjectFeatureToggle } from "./helper";
import { SettingsControlItem } from "@/components/settings/control-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const ProjectFeaturesList = observer(function ProjectFeaturesList(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = (_featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload);

    setPromiseToast(updateProjectPromise, {
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
    void updateProjectPromise.then(() => {
      return undefined;
    });
  };

  return (
    <>
      {Object.entries(PROJECT_FEATURES_LIST).map(([featureSectionKey, feature]) => (
        <div key={featureSectionKey}>
          <SettingsHeading title={t(feature.key)} description={t(`${feature.key}_description`)} />
          <div className="mt-6">
            {Object.entries(feature.featureList).map(([featureItemKey, featureItem]) => (
              <div key={featureItemKey} className="gap-x-8 gap-y-2 py-2 border-b border-subtle bg-surface-1">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 size-10 grid place-items-center rounded-sm bg-layer-2">
                    {featureItem.icon}
                  </div>
                  <SettingsControlItem
                    title={
                      <span className="flex items-center gap-2">
                        {t(featureItem.key)}
                        {featureItem.isPro && (
                          <Tooltip tooltipContent="Pro feature" position="top">
                            <UpgradeBadge className="rounded-sm" />
                          </Tooltip>
                        )}
                      </span>
                    }
                    description={t(`${featureItem.key}_description`)}
                    control={
                      <ProjectFeatureToggle
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        featureItem={featureItem}
                        value={Boolean(currentProjectDetails?.[featureItem.property as keyof IProject])}
                        handleSubmit={handleSubmit}
                        disabled={!isAdmin}
                      />
                    }
                  />
                </div>
                <div className="pl-14">
                  {currentProjectDetails?.[featureItem.property as keyof IProject] &&
                    featureItem.renderChildren?.(currentProjectDetails, workspaceSlug)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
});
