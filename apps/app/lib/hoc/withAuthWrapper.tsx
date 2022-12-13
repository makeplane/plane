import React from "react";
// next
import type { NextPage } from "next";
// redirect
import redirect from "lib/redirect";

const withAuth = (WrappedComponent: NextPage, getBackToSameRoute: boolean = true) => {
  const Wrapper: NextPage<any> = (props) => {
    return <WrappedComponent {...props} />;
  };

  Wrapper.getInitialProps = async (ctx) => {
    const isServer = typeof window === "undefined";

    const cookies = isServer ? ctx?.req?.headers.cookie : document.cookie;

    const token = cookies?.split("accessToken=")?.[1]?.split(";")?.[0];

    if (!token) {
      if (getBackToSameRoute) redirect(ctx, "/signin?next=" + ctx?.asPath);
      else redirect(ctx, "/signin");
    }

    const pageProps =
      WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx));

    return { ...pageProps };
  };

  return Wrapper;
};

export default withAuth;
