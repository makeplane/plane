import useSWR from "swr";

import { CURRENT_USER } from "constants/fetch-keys";
import userService from "services/user.service";
import { useRouter } from "next/router";

type Props = {
  children: React.ReactNode;
};

export const UserAuthorizationLayout: React.FC<Props> = ({ children }) => {
  const router = useRouter();

  const { data: currentUser, error } = useSWR(CURRENT_USER, () => userService.currentUser());

  if (!currentUser && !error) {
    return <div className="grid place-items-center h-screen">Loading...</div>;
  }

  if (error?.status === 401) {
    const redirectTo = router.asPath;

    router.push(`/signin?next=${redirectTo}`);
    return null;
  }

  return <>{children}</>;
};
