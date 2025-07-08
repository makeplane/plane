import { Calendar, CircleChevronDown, ToggleLeft, UsersRound, Hash, AlignLeft, LucideIcon } from "lucide-react";
// plane imports
import { TIssuePropertyTypeIconKey } from "@plane/types";
import { cn } from "@plane/utils";

const ISSUE_PROPERTY_ICON_MAP: Record<TIssuePropertyTypeIconKey, LucideIcon> = {
  AlignLeft: AlignLeft,
  Hash: Hash,
  CircleChevronDown: CircleChevronDown,
  ToggleLeft: ToggleLeft,
  Calendar: Calendar,
  UsersRound: UsersRound,
};

type TPropertyTypeIconProps = {
  iconKey: TIssuePropertyTypeIconKey;
  className?: string;
};

export const PropertyTypeIcon = ({ iconKey, className }: TPropertyTypeIconProps) => {
  const Icon = ISSUE_PROPERTY_ICON_MAP[iconKey];
  return <Icon className={cn("size-3 text-custom-text-200", className)} />;
};
