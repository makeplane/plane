import { observer } from "mobx-react-lite";
import { ChevronDown } from "lucide-react";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, UserGroupIcon } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";

type ButtonProps = {
  className?: string;
  dropdownArrow: boolean;
  placeholder: string;
  hideText?: boolean;
  userIds: string | string[] | null;
};

const ButtonAvatars = observer(({ userIds }: { userIds: string | string[] | null }) => {
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroup size="md">
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
      return <Avatar src={userDetails?.avatar} name={userDetails?.display_name} size="md" />;
    }
  }

  return <UserGroupIcon className="h-3 w-3 flex-shrink-0" />;
});

export const BorderButton = observer((props: ButtonProps) => {
  const { className, dropdownArrow, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1.5 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
        className
      )}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? placeholder : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
      {dropdownArrow && <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
    </div>
  );
});

export const BackgroundButton = observer((props: ButtonProps) => {
  const { className, dropdownArrow, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn("h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80", className)}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? placeholder : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
      {dropdownArrow && <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
    </div>
  );
});

export const TransparentButton = observer((props: ButtonProps) => {
  const { className, dropdownArrow, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
        className
      )}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? placeholder : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
      {dropdownArrow && <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
    </div>
  );
});
