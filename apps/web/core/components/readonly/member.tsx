import { observer } from "mobx-react";
import type { LucideIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";

export type TReadonlyMemberProps = {
  className?: string;
  icon?: LucideIcon;
  hideIcon?: boolean;
  value: string | string[];
  placeholder?: string;
  multiple?: boolean;
  projectId?: string;
};

export const ReadonlyMember = observer(function ReadonlyMember(props: TReadonlyMemberProps) {
  const { className, icon: Icon, hideIcon = false, value, placeholder, multiple = false } = props;

  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const memberIds = Array.isArray(value) ? value : value ? [value] : [];
  const members = memberIds.map((id) => getUserDetails(id)).filter(Boolean);

  if (members.length === 0) {
    return (
      <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        {<ButtonAvatars showTooltip={false} userIds={value} icon={Icon} />}
        <span className="flex-grow truncate">{placeholder ?? t("common.none")}</span>
      </div>
    );
  }

  if (multiple) {
    return (
      <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        {!hideIcon && Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
        <ButtonAvatars showTooltip={false} userIds={memberIds} />
      </div>
    );
  }

  const member = members[0];

  return (
    <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
      {!hideIcon && Icon && <Icon className="size-4 flex-shrink-0" />}
      <div className="flex items-center gap-2">
        <div className="size-4 rounded-full bg-layer-1 flex items-center justify-center">
          <span className="text-13 font-medium">
            {member?.display_name?.charAt(0) ?? member?.email?.charAt(0) ?? "?"}
          </span>
        </div>
        <span className="flex-grow truncate">{member?.display_name ?? member?.email}</span>
      </div>
    </div>
  );
});
