"use client";

// components
import { AuthBase } from "@/components/auth-screens";
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// assets
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers";

const SignInPage = () => (
  <DefaultLayout>
    <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
      <AuthBase authType={EAuthModes.SIGN_UP} />
    </AuthenticationWrapper>
  </DefaultLayout>
);

export default SignInPage;
