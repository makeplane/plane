import { observer } from "mobx-react";
// components
import { ForgotPasswordForm } from "@/components/account/auth-forms/forgot-password";
import { AuthHeader } from "@/components/auth-screens/header";
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

function ForgotPasswordPage() {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
        <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
          <AuthHeader type={EAuthModes.SIGN_IN} />
          <ForgotPasswordForm />
        </div>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default observer(ForgotPasswordPage);
