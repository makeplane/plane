import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { UserService } from "services/user.service";
// ui
import { Spinner } from "@plane/ui";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";

export interface IUserAuthWrapper {
  children: ReactNode;
}

// services
const userService = new UserService();

export const UserAuthWrapper: FC<IUserAuthWrapper> = (props) => {
  const { children } = props;
  // router
  const router = useRouter();
  // fetching user information
  const { data: currentUser, error } = useSWR(CURRENT_USER, () => userService.currentUser());

  if (!currentUser && !error) {
    return (
      <div className="h-screen grid place-items-center p-4">
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
