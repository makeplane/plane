import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// import useSWRImmutable from "swr/immutable";
// ui
import { Spinner } from "@plane/ui";
// hooks
import { useUser, useUserProfile, useWorkspace } from "@/hooks/store";

export interface IUserAuthWrapper {
  children: ReactNode;
}

export const UserAuthWrapper: FC<IUserAuthWrapper> = observer((props) => {
  const { children } = props;
  // store hooks
  const { fetchCurrentUser, data: currentUser, error: currentUserError } = useUser();
  const { fetchUserProfile } = useUserProfile();
  const { fetchWorkspaces } = useWorkspace();
  // router
  const router = useRouter();
  // fetching user information
  const { error } = useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  useSWR("CURRENT_USER_PROFILE_DETAILS", () => fetchUserProfile(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  // useSWRImmutable("CURRENT_USER_INSTANCE_ADMIN_STATUS", () => fetchCurrentUserInstanceAdminStatus(), {
  //   shouldRetryOnError: false,
  // });
  // fetching user settings
  // const { isLoading: userSettingsLoader } = useSWR("CURRENT_USER_SETTINGS", () => fetchCurrentUserSettings(), {
  //   shouldRetryOnError: false,
  // });
  // fetching all workspaces
  const { isLoading: workspaceLoader } = useSWR("USER_WORKSPACES_LIST", () => fetchWorkspaces(), {
    shouldRetryOnError: false,
  });

  if ((!currentUser && !currentUserError) || workspaceLoader) {
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
