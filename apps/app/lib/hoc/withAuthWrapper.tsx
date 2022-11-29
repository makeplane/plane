import React, { useEffect } from "react";
// next
import type { NextPage } from "next";
// axios configurations
import { setAxiosHeader } from "configuration/axios-configuration";
// redirect
import redirect from "lib/redirect";

const withAuthWrapper = (WrappedComponent: NextPage) => {
  const Wrapper: NextPage<any> = (props) => {
    useEffect(() => {
      if (props?.tokenDetails && props?.tokenDetails?.access_token) {
        setAxiosHeader(props.tokenDetails.access_token);
      }
    }, [props]);

    return <WrappedComponent {...props} />;
  };

  Wrapper.getInitialProps = async (ctx) => {
    const componentProps =
      WrappedComponent.getInitialProps &&
      (await WrappedComponent.getInitialProps(ctx));
    return { ...componentProps };
  };

  return Wrapper;
};

export default withAuthWrapper;
