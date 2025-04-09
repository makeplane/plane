import { IProject } from "@plane/types";
import { INTAKE_FEATURES_LIST } from "@/plane-web/constants";
import { WithFeatureFlagHOC } from "../../feature-flags";
import IntakeSubFeatures from "./intake/intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake/intake-sub-features-upgrade";

type Props = {
  feature: string;
  currentProjectDetails: IProject;
  workspaceSlug: string;
};
export const ProjectFeatureChildren = ({ feature, currentProjectDetails, workspaceSlug }: Props) => {
  const renderComponent = () => {
    if (feature === "inbox")
      return (
        <WithFeatureFlagHOC
          workspaceSlug={workspaceSlug?.toString()}
          flag="INTAKE_SETTINGS"
          fallback={
            <IntakeSubFeaturesUpgrade projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
          }
        >
          <IntakeSubFeatures projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
        </WithFeatureFlagHOC>
      );
    else return null;
  };

  return renderComponent();
};
