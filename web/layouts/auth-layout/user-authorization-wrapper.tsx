import { useRouter } from "next/router";

import useSWR from "swr";

// services
import userService from "services/user.service";
// ui
import { Spinner } from "components/ui";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  children: React.ReactNode;
};

export const UserAuthorizationLayout: React.FC<Props> = ({ children }) => {
  const store: RootStore = useMobxStore();
  const router = useRouter();

  const { data: currentUser, error } = useSWR(CURRENT_USER, () => userService.currentUser());

  if (!currentUser && !error) {
    return (
      <div className="h-screen grid place-items-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <h3 className="text-xl" suppressHydrationWarning>
            {store.locale.localized("Loading your profile...")}
          </h3>
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
