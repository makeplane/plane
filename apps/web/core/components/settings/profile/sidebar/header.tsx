import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store/user";
import { getFileURL } from "@plane/utils";

export const ProfileSettingsSidebarHeader = observer(function ProfileSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <div className="shrink-0 flex items-center gap-2">
      <div className="shrink-0">
        <Avatar
          src={getFileURL(currentUser?.avatar_url ?? "")}
          name={currentUser?.display_name}
          size={32}
          shape="circle"
          className="text-16"
        />
      </div>
      <div className="truncate">
        <p className="text-body-sm-medium truncate">
          {currentUser?.first_name} {currentUser?.last_name}
        </p>
        <p className="text-caption-md-regular truncate">{currentUser?.email}</p>
      </div>
    </div>
  );
});
