import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser, useUserProfile } from "@/hooks/store";

type TAuthWrapper = {
  children: ReactNode;
  pageType?: EPageTypes;
};

export const AuthWrapper: FC<TAuthWrapper> = observer((props) => {
  const router = useRouter();
  const { children, pageType = EPageTypes.AUTHENTICATED } = props;
  // hooks
  const { isLoading, data: currentUser, fetchCurrentUser } = useUser();
  const { data: currentUserProfile } = useUserProfile();

  const { isLoading: isSWRLoading } = useSWR("INSTANCE_INFORMATION", () => fetchCurrentUser(), {
    revalidateOnFocus: false,
  });

  if (isSWRLoading || isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (pageType === EPageTypes.PUBLIC) return <>{children}</>;

  if (pageType === EPageTypes.INIT) {
    if (!currentUser?.id) return <>{children}</>;
    else {
      if (
        currentUserProfile &&
        currentUserProfile?.id &&
        Boolean(currentUserProfile?.onboarding_step?.profile_complete)
      )
        return <>{children}</>;
      else {
        router.push(`/onboarding`);
        return <></>;
      }
    }
  }

  if (pageType === EPageTypes.NON_AUTHENTICATED) {
    if (!currentUser?.id) return <>{children}</>;
    else {
      if (currentUserProfile?.id && currentUserProfile?.onboarding_step?.profile_complete) {
        router.push(`/`);
        return <></>;
      } else {
        router.push(`/onboarding`);
        return <></>;
      }
    }
  }

  if (pageType === EPageTypes.ONBOARDING) {
    if (!currentUser?.id) {
      router.push(`/`);
      return <></>;
    } else {
      if (currentUserProfile?.id && currentUserProfile?.onboarding_step?.profile_complete) {
        router.push(`/`);
        return <></>;
      } else return <>{children}</>;
    }
  }

  if (pageType === EPageTypes.AUTHENTICATED) {
    if (!currentUser?.id) return <>{children}</>;
    else {
      if (currentUserProfile?.id && currentUserProfile?.onboarding_step?.profile_complete) return <>{children}</>;
      else {
        router.push(`/onboarding`);
        return <></>;
      }
    }
  }

  return <>{children}</>;
});
