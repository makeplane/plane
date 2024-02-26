import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, UserGroupIcon } from "@plane/ui";

type AvatarProps = {
  showTooltip: boolean;
  userIds: string | string[] | null;
};

export const ButtonAvatars: React.FC<AvatarProps> = observer((props) => {
  const { showTooltip, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroup size="md" showTooltip={!showTooltip}>
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
      return <Avatar src={userDetails?.avatar} name={userDetails?.display_name} size="md" showTooltip={!showTooltip} />;
    }
  }

  return <UserGroupIcon className="h-3 w-3 flex-shrink-0" />;
});
