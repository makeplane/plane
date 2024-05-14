"use client";

import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { IEmailCheckData } from "@plane/types";
import { EmailForm, UniqueCodeForm, PasswordForm, OAuthOptions, TermsAndConditions } from "@/components/accounts";
// hooks
import { useInstance } from "@/hooks/store";
import useToast from "@/hooks/use-toast";
// services
import { AuthService } from "@/services/auth.service";

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
  [mode in EAuthModes]: TTitle;
};

const titles: THeaderSubheader = {
  [EAuthModes.SIGN_IN]: {
    header: "Sign in to upvote or comment",
    subHeader: "Contribute in nudging the features you want to get built.",
  },
  [EAuthModes.SIGN_UP]: {
    header: "Comment or react to issues",
    subHeader: "Use plane to add your valuable inputs to features.",
  },
};

const getHeaderSubHeader = (mode: EAuthModes | null): TTitle => {
  if (mode) {
    return titles[mode];
  }

  return {
    header: "Comment or react to issues",
    subHeader: "Use plane to add your valuable inputs to features.",
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
  const { config: instanceConfig } = useInstance();
  // derived values
  const isSmtpConfigured = instanceConfig?.is_smtp_configured;

  const { header, subHeader } = getHeaderSubHeader(authMode);

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

  const isOAuthEnabled = instanceConfig && (instanceConfig?.is_google_enabled || instanceConfig?.is_github_enabled);

  return (
    <div className="relative flex flex-col space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-3xl font-bold text-onboarding-text-100">{header}</h3>
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
      {isOAuthEnabled !== undefined && <OAuthOptions />}
      <TermsAndConditions mode={authMode} />
    </div>
  );
});
