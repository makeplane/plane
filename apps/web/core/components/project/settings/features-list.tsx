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
import { useUser } from "@/hooks/store/user";
// plane web imports
import { UpgradeBadge } from "@/plane-web/components/workspace/upgrade-badge";
import { PROJECT_FEATURES_LIST } from "@/plane-web/constants/project/settings";
import { ProjectFeatureToggle } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const ProjectFeaturesList = observer(function ProjectFeaturesList(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = (featureKey: string, featureProperty: string) => {
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

  if (!currentUser) return <></>;

  return (
    <div className="space-y-6">
      {Object.entries(PROJECT_FEATURES_LIST).map(([featureSectionKey, feature]) => (
        <div key={featureSectionKey} className="">
          <SettingsHeading title={t(feature.key)} description={t(`${feature.key}_description`)} />
          {Object.entries(feature.featureList).map(([featureItemKey, featureItem]) => (
            <div key={featureItemKey} className="gap-x-8 gap-y-2 border-b border-subtle bg-surface-1 py-4">
              <div key={featureItemKey} className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center rounded-sm bg-surface-2 p-3">{featureItem.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-13 font-medium leading-5">{t(featureItem.key)}</h4>
                      {featureItem.isPro && (
                        <Tooltip tooltipContent="Pro feature" position="top">
                          <UpgradeBadge className="rounded-sm" />
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-13 leading-5 tracking-tight text-tertiary">
                      {t(`${featureItem.key}_description`)}
                    </p>
                  </div>
                </div>
                <ProjectFeatureToggle
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  featureItem={featureItem}
                  value={Boolean(currentProjectDetails?.[featureItem.property as keyof IProject])}
                  handleSubmit={handleSubmit}
                  disabled={!isAdmin}
                />
              </div>
              <div className="pl-14">
                {currentProjectDetails?.[featureItem.property as keyof IProject] &&
                  featureItem.renderChildren?.(currentProjectDetails, workspaceSlug)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
