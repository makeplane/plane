import * as React from "react";
import { FileText, Layers, Timer } from "lucide-react";
import { ContrastIcon, DiceIcon, Intake } from "@plane/ui";

const ICONS = {
  cycles: <ContrastIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-custom-text-300" />,
  modules: <DiceIcon width={20} height={20} className="flex-shrink-0 text-custom-text-300" />,
  views: <Layers className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
  pages: <FileText className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
  intake: <Intake className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
  is_time_tracking_enabled: <Timer className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
};

export const ProjectFeatureIcons = ({
  featureType,
}: {
  featureType: string;
  size?: number;
  className?: string;
  renderColor?: boolean;
}) => {
  if (featureType === undefined) return null;
  const Icon = ICONS[featureType as keyof typeof ICONS];
  return Icon;
};
