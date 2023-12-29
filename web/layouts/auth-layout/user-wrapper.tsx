import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
// ui
import { Spinner } from "@plane/ui";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

export interface IUserAuthWrapper {
  children: ReactNode;
}

export const UserAuthWrapper: FC<IUserAuthWrapper> = observer((props) => {
  const { children } = props;
  // store
  const {
    user: {
      currentUser,
      currentUserError,
      fetchCurrentUser,
      fetchCurrentUserInstanceAdminStatus,
      fetchCurrentUserSettings,
    },
    workspace: { fetchWorkspaces },
  } = useMobxStore();
  // router
  const router = useRouter();
  // fetching user information
  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  useSWRImmutable("CURRENT_USER_INSTANCE_ADMIN_STATUS", () => fetchCurrentUserInstanceAdminStatus(), {
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

  if (!currentUser && !currentUserError) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (currentUserError) {
    const redirectTo = router.asPath;
    router.push(`/?next_path=${redirectTo}`);
    return null;
  }

  return <>{children}</>;
});
