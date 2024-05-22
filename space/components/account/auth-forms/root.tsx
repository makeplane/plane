import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { IEmailCheckData } from "@plane/types";
import { EmailForm, UniqueCodeForm, PasswordForm, OAuthOptions, TermsAndConditions } from "@/components/accounts";
// hooks
import useToast from "@/hooks/use-toast";
import { useMobxStore } from "@/lib/mobx/store-provider";
// services
import { AuthService } from "@/services/authentication.service";

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
}

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

type TTitle = {
  header: string;
  subHeader: string;
};

type THeaderSubheader = {
  [mode in EAuthModes]: {
    [step in Exclude<EAuthSteps, EAuthSteps.EMAIL>]: TTitle;
  };
};

const Titles: THeaderSubheader = {
  [EAuthModes.SIGN_IN]: {
    [EAuthSteps.PASSWORD]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.PASSWORD]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
  },
};

// TODO: Better approach for this.
const getHeaderSubHeader = (mode: EAuthModes | null, step: EAuthSteps): TTitle => {
  if (mode) {
    return (Titles[mode] as any)[step];
  }

  return {
    header: "Get started with Plane",
    subHeader: "Progress, visualize, and measure work how it works best for you.",
  };
};

const authService = new AuthService();

export const AuthRoot = observer(() => {
  const { setToastAlert } = useToast();
  // states
  const [authMode, setAuthMode] = useState<EAuthModes | null>(null);
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState("");
  // hooks
  const {
    instanceStore: { instance },
  } = useMobxStore();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  const { header, subHeader } = getHeaderSubHeader(authMode, authStep);

  const handelEmailVerification = async (data: IEmailCheckData) => {
    // update the global email state
    setEmail(data.email);

    await authService
      .emailCheck(data)
      .then((res) => {
        // Set authentication mode based on user existing status.
        if (res.existing) {
          setAuthMode(EAuthModes.SIGN_IN);
        } else {
          setAuthMode(EAuthModes.SIGN_UP);
        }

        // If user exists and password is already setup by the user, move to password sign in.
        if (res.existing && !res.is_password_autoset) {
          setAuthStep(EAuthSteps.PASSWORD);
        } else {
          // Else if SMTP is configured, move to unique code sign-in/ sign-up.
          if (isSmtpConfigured) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
          } else {
            // Else show error message if SMTP is not configured and password is not set.
            if (res.existing) {
              setAuthMode(null);
              setToastAlert({
                type: "error",
                title: "Error!",
                message: "Unable to process request please contact Administrator to reset password",
              });
            } else {
              // If SMTP is not configured and user is new, move to password sign-up.
              setAuthStep(EAuthSteps.PASSWORD);
            }
          }
        }
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);
  return (
    <>
      <div className="mx-auto flex flex-col">
        <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">{header}</h3>
          <p className="font-medium text-onboarding-text-400">{subHeader}</p>
        </div>
        {authStep === EAuthSteps.EMAIL && <EmailForm onSubmit={handelEmailVerification} />}
        {authMode && (
          <>
            {authStep === EAuthSteps.PASSWORD && (
              <PasswordForm
                email={email}
                mode={authMode}
                handleEmailClear={() => {
                  setEmail("");
                  setAuthMode(null);
                  setAuthStep(EAuthSteps.EMAIL);
                }}
                handleStepChange={(step) => setAuthStep(step)}
              />
            )}
            {authStep === EAuthSteps.UNIQUE_CODE && (
              <UniqueCodeForm
                email={email}
                mode={authMode}
                handleEmailClear={() => {
                  setEmail("");
                  setAuthMode(null);
                  setAuthStep(EAuthSteps.EMAIL);
                }}
                submitButtonText="Continue"
              />
            )}
          </>
        )}
      </div>
      {isOAuthEnabled && <OAuthOptions />}
      <TermsAndConditions mode={authMode} />
    </>
  );
});
