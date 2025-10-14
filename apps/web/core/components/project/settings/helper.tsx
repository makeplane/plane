import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { EPillVariant, Pill, EPillSize } from "@plane/propel/pill";
import { ToggleSwitch } from "@plane/ui";
import { TProperties } from "@/plane-web/constants/project/settings";

type Props = {
  workspaceSlug: string;
  projectId: string;
  featureItem: TProperties;
  isEnabled: boolean;
  handleSubmit: (featureKey: string, featureProperty: string) => void;
  isAdmin: boolean;
};

export const ProjectFeatureToggle = (props: Props) => {
  const { workspaceSlug, projectId, featureItem, isEnabled, handleSubmit, isAdmin } = props;
  return featureItem.href ? (
    <Link href={`/${workspaceSlug}/settings/projects/${projectId}/features/${featureItem.href}`}>
      <div className="flex items-center gap-2">
        <Pill
          variant={isEnabled ? EPillVariant.PRIMARY : EPillVariant.DEFAULT}
          size={EPillSize.SM}
          className="border-none rounded-lg"
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </Pill>
        <ChevronRight className="h-4 w-4 text-custom-text-300" />
      </div>
    </Link>
  ) : (
    <ToggleSwitch
      value={isEnabled}
      onChange={() => handleSubmit(featureItem.key, featureItem.property)}
      disabled={isEnabled || !isAdmin}
      size="sm"
      data-ph-element={PROJECT_TRACKER_ELEMENTS.TOGGLE_FEATURE}
    />
  );
};
