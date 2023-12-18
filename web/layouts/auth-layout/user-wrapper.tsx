import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
<<<<<<< HEAD
// hooks
import { useUser, useWorkspace } from "hooks/store";
=======
import useSWRImmutable from "swr/immutable";
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
// ui
import { Spinner } from "@plane/ui";

export interface IUserAuthWrapper {
  children: ReactNode;
}

export const UserAuthWrapper: FC<IUserAuthWrapper> = observer((props) => {
  const { children } = props;
  // store hooks
  const {
    currentUser,
    currentUserError,
    fetchCurrentUser,
    fetchCurrentUserInstanceAdminStatus,
    fetchCurrentUserSettings,
  } = useUser();
  const { fetchWorkspaces } = useWorkspace();
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
    router.push(`/?next=${redirectTo}`);
    return null;
  }

  return <>{children}</>;
});
