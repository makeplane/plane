import { observer } from "mobx-react-lite";
import { ChevronDown } from "lucide-react";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, Tooltip, UserGroupIcon } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";

type ButtonProps = {
  className?: string;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  placeholder: string;
  hideIcon?: boolean;
  hideText?: boolean;
  isActive?: boolean;
  tooltip: boolean;
  userIds: string | string[] | null;
};

const ButtonAvatars = observer(({ tooltip, userIds }: { tooltip: boolean; userIds: string | string[] | null }) => {
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroup size="md" showTooltip={!tooltip}>
          {userIds.map((userId) => {
            const userDetails = getUserDetails(userId);

            if (!userDetails) return;
            return <Avatar key={userId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return <Avatar src={userDetails?.avatar} name={userDetails?.display_name} size="md" showTooltip={!tooltip} />;
    }
  }

  return <UserGroupIcon className="h-3 w-3 flex-shrink-0" />;
});

export const BorderButton = observer((props: ButtonProps) => {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    isActive = false,
    placeholder,
    userIds,
    tooltip,
  } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isArray = Array.isArray(userIds);

  return (
    <Tooltip
      tooltipHeading={placeholder}
      tooltipContent={`${userIds?.length ?? 0} assignee${userIds?.length !== 1 ? "s" : ""}`}
      disabled={!tooltip}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {!hideIcon && <ButtonAvatars tooltip={tooltip} userIds={userIds} />}
        {!hideText && (
          <span className="flex-grow truncate text-sm leading-5">
            {isArray && userIds.length > 0
              ? userIds.length === 1
                ? getUserDetails(userIds[0])?.display_name
                : ""
              : placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
});

export const BackgroundButton = observer((props: ButtonProps) => {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    placeholder,
    userIds,
    tooltip,
  } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isArray = Array.isArray(userIds);

  return (
    <Tooltip
      tooltipHeading={placeholder}
      tooltipContent={`${userIds?.length ?? 0} assignee${userIds?.length !== 1 ? "s" : ""}`}
      disabled={!tooltip}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80",
          className
        )}
      >
        {!hideIcon && <ButtonAvatars tooltip={tooltip} userIds={userIds} />}
        {!hideText && (
          <span className="flex-grow truncate text-sm leading-5">
            {isArray && userIds.length > 0
              ? userIds.length === 1
                ? getUserDetails(userIds[0])?.display_name
                : ""
              : placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
});

export const TransparentButton = observer((props: ButtonProps) => {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    isActive = false,
    placeholder,
    userIds,
    tooltip,
  } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isArray = Array.isArray(userIds);

  return (
    <Tooltip
      tooltipHeading={placeholder}
      tooltipContent={`${userIds?.length ?? 0} assignee${userIds?.length !== 1 ? "s" : ""}`}
      disabled={!tooltip}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {!hideIcon && <ButtonAvatars tooltip={tooltip} userIds={userIds} />}
        {!hideText && (
          <span className="flex-grow truncate text-sm leading-5">
            {isArray && userIds.length > 0
              ? userIds.length === 1
                ? getUserDetails(userIds[0])?.display_name
                : ""
              : placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
});
