import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { FC, ReactNode } from "react";
import useSWR from "swr";
// hooks
import { Spinner } from "@plane/ui";
import { useUser, useWorkspace } from "@/hooks/store";
// ui
import { useUserProfile } from "hooks/store/use-user-profile";

export interface IUserAuthWrapper {
  children: ReactNode;
}

export const UserAuthWrapper: FC<IUserAuthWrapper> = observer((props) => {
  const { children } = props;
  // store hooks
  const { data, fetchCurrentUser, fetchUserAccounts } = useUser();
  const { fetchUserProfile } = useUserProfile();
  const { fetchWorkspaces } = useWorkspace();
  // router
  const router = useRouter();
  // fetching user information
  const { error } = useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  useSWRImmutable("CURRENT_USER_INSTANCE_ADMIN_STATUS", () => fetchCurrentUserInstanceAdminStatus(), {
    shouldRetryOnError: false,
  });
  // fetching user settings
  const { isLoading: userSettingsLoader } = useSWR("CURRENT_USER_SETTINGS", () => fetchCurrentUserSettings(), {
    shouldRetryOnError: false,
  });
  // fetching all workspaces
  const { isLoading: workspaceLoader } = useSWR("USER_WORKSPACES_LIST", () => fetchWorkspaces(), {
    shouldRetryOnError: false,
  });

  if ((!currentUser && !currentUserError) || userSettingsLoader || workspaceLoader) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    const redirectTo = router.asPath;
    router.push(`/?next_path=${redirectTo}`);
    return null;
  }

  return <>{children}</>;
});
