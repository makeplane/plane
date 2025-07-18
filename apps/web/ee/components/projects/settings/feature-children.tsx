import { observer } from "mobx-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { IProject } from "@plane/types";
// plane web components
import { INTAKE_FEATURES_LIST } from "@/plane-web/constants";
// hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import IntakeSubFeatures from "./intake/intake-sub-features";
import IntakeSubFeaturesUpgrade from "./intake/intake-sub-features-upgrade";

type Props = {
  feature: string;
  currentProjectDetails: IProject;
  workspaceSlug: string;
};
export const ProjectFeatureChildren = observer(({ feature, currentProjectDetails, workspaceSlug }: Props) => {
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  const renderComponent = () => {
    if (feature === "inbox")
      return isEmailEnabled || isFormEnabled ? (
        <IntakeSubFeatures projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
      ) : (
        <IntakeSubFeaturesUpgrade projectId={currentProjectDetails?.id} featureList={INTAKE_FEATURES_LIST} />
      );
    else return null;
  };

  return renderComponent();
});
