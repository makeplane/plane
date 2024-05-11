"use client";

import { FC, ReactNode } from "react";
// import { useRouter, usePathname } from "next/navigation";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
// hooks
import useUser from "hooks/use-user";
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
    currentUserLoader,
    currentUserError,
    fetchCurrentUser,
    fetchCurrentUserInstanceAdminStatus,
  } = useUser();
  // router
  // const router = useRouter();
  // const pathname = usePathname();
  // fetching user information
  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  // fetching current user instance admin status
  useSWRImmutable(
    "CURRENT_USER_INSTANCE_ADMIN_STATUS",
    () => fetchCurrentUserInstanceAdminStatus(),
    {
      shouldRetryOnError: false,
    }
  );

  if (currentUserLoader && !currentUser && !currentUserError) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // TODO: Login page
  if (currentUserError) {
    // router.push(`/?next_path=${pathname}`);
    // return null;
    return <div>Login Page</div>;
  }

  return <>{children}</>;
});
