"use client";

// layouts
import { DefaultLayout } from "@/layouts";
// components
import { PageHeader } from "@/components/core";
import { InstanceSignInForm } from "@/components/login";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType, EInstancePageType } from "@/helpers";

const LoginPage = () => (
  <>
    <PageHeader title="Login - God Mode" />
    <InstanceWrapper pageType={EInstancePageType.POST_SETUP}>
      <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>
        <DefaultLayout>
          <InstanceSignInForm />
        </DefaultLayout>
      </AuthWrapper>
    </InstanceWrapper>
  </>
);

export default LoginPage;
