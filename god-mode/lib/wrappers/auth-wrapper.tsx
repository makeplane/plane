"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useUser } from "@/hooks";
// ui
// import { Spinner } from "@plane/ui";

export interface IAuthWrapper {
  children: ReactNode;
}

export const AuthWrapper: FC<IAuthWrapper> = observer((props) => {
  const { children } = props;
  // hooks
  const {
    // currentUser,
    //  currentUserLoader,
    // currentUserError,
    fetchCurrentUser,
  } = useUser();

  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });

  // if (currentUserLoader && !currentUser && !currentUserError) {
  //   return (
  //     <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
  //       <div className="flex flex-col items-center gap-3 text-center">
  //         <Spinner />
  //       </div>
  //     </div>
  //   );
  // }

  // if (currentUserError) {
  //   // router.push(`/?next_path=${pathname}`);
  //   // return null;
  //   return <div>Login Page</div>;
  // }

  return <>{children}</>;
});
