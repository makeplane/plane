import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { EPillVariant, Pill, EPillSize } from "@plane/propel/pill";
import { ToggleSwitch } from "@plane/ui";
import type { TProperties } from "@/plane-web/constants/project/settings/features";

type Props = {
  workspaceSlug: string;
  projectId: string;
  featureItem: TProperties;
  value: boolean;
  handleSubmit: (featureKey: string, featureProperty: string) => void;
  disabled?: boolean;
};

export const ProjectFeatureToggle = (props: Props) => {
  const { workspaceSlug, projectId, featureItem, value, handleSubmit, disabled } = props;
  return featureItem.href ? (
    <Link href={`/${workspaceSlug}/settings/projects/${projectId}/features/${featureItem.href}`}>
      <div className="flex items-center gap-2">
        <Pill
          variant={value ? EPillVariant.PRIMARY : EPillVariant.DEFAULT}
          size={EPillSize.SM}
          className="border-none rounded-lg"
        >
          {value ? "Enabled" : "Disabled"}
        </Pill>
        <ChevronRight className="h-4 w-4 text-custom-text-300" />
      </div>
    </Link>
  ) : (
    <ToggleSwitch
      value={value}
      onChange={() => handleSubmit(featureItem.key, featureItem.property)}
      disabled={disabled}
      size="sm"
      data-ph-element={PROJECT_TRACKER_ELEMENTS.TOGGLE_FEATURE}
    />
  );
};
