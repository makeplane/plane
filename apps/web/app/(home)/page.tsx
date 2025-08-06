"use client";
import React from "react";
// components
// constants
// helpers
import { AuthBase } from "@/components/auth-screens";
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// hooks
// layouts
import DefaultLayout from "@/layouts/default-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// assets

const HomePage = () => (
  <DefaultLayout>
    <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
      <AuthBase authType={EAuthModes.SIGN_IN} />
    </AuthenticationWrapper>
  </DefaultLayout>
);

export default HomePage;
