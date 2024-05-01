import { FC, ReactNode } from "react";
// hooks
import { useUser } from "@/hooks/store";

type TPageType = "public" | "onboarding" | "private";

type TAuthenticationWrapper = {
  children: ReactNode;
  pageType: TPageType;
};

export const AuthenticationWrapper: FC<TAuthenticationWrapper> = (props) => {
  const { children, pageType } = props;
  // hooks
  const { data: currentUser } = useUser();

  console.log("currentUser", currentUser);

  return <div key={pageType}>{children}</div>;
};
