import { FC } from "react";
import { observer } from "mobx-react";
import { UserRound } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";

export const UserAvatarName: FC<{ userId: string }> = observer(({ userId }) => {
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const user = getUserDetails(userId);
  return (
    <div className="flex items-center gap-2">
      {user?.avatar_url && user?.avatar_url !== "" ? (
        <Avatar
          className="shrink-0"
          name={user?.display_name}
          src={getFileURL(user?.avatar_url)}
          size={24}
          shape="circle"
        />
      ) : (
        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-custom-background-80  capitalize overflow-hidden">
          {user?.display_name ? user?.display_name?.[0] : <UserRound className="text-custom-text-200 " size={12} />}
        </div>
      )}
      <span className="break-words text-custom-text-200">{user?.display_name ?? t(`Unassigned`)}</span>
    </div>
  );
});
