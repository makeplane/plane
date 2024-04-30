import { FC, ReactNode } from "react";

type TPageType = "public" | "onboarding" | "private";

type TAuthenticationWrapper = {
  children: ReactNode;
  pageType: TPageType;
};

export const AuthenticationWrapper: FC<TAuthenticationWrapper> = (props) => {
  const { children, pageType } = props;

  return <div key={pageType}>{children}</div>;
};
