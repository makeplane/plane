import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// ui
import { Spinner } from "@plane/ui";
// store
import { useMobxStore } from "lib/mobx/store-provider";

export interface IUserAuthWrapper {
  children: ReactNode;
}

export const UserAuthWrapper: FC<IUserAuthWrapper> = (props) => {
  const { children } = props;
  // store
  const {
    user: { fetchCurrentUser, fetchCurrentUserInstanceAdminStatus, fetchCurrentUserSettings },
    workspace: { fetchWorkspaces },
  } = useMobxStore();
  // router
  const router = useRouter();
  // fetching user information
  const { data: currentUser, error } = useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  useSWR("CURRENT_USER_INSTANCE_ADMIN_STATUS", () => fetchCurrentUserInstanceAdminStatus(), {
    shouldRetryOnError: false,
  });
  // fetching user settings
  useSWR("CURRENT_USER_SETTINGS", () => fetchCurrentUserSettings(), {
    shouldRetryOnError: false,
  });
  // fetching all workspaces
  useSWR(`USER_WORKSPACES_LIST`, () => fetchWorkspaces(), {
    shouldRetryOnError: false,
  });

  if (!currentUser && !error) {
    return (
      <div className="h-screen grid place-items-center p-4 bg-custom-background-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    const redirectTo = router.asPath;
    router.push(`/?next=${redirectTo}`);
    return null;
  }

  return <>{children}</>;
};
