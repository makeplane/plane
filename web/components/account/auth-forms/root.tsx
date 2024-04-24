import React, { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IEmailCheckData, IWorkspaceMemberInvitation } from "@plane/types";
// ui
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AuthEmailForm,
  AuthPasswordForm,
  OAuthOptions,
  TermsAndConditions,
  UniqueCodeForm,
} from "@/components/account";
import { WorkspaceLogo } from "@/components/workspace/logo";
import { useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";
import { WorkspaceService } from "@/services/workspace.service";

const authService = new AuthService();
const workSpaceService = new WorkspaceService();

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

type Props = {
  mode: EAuthModes;
};

const Titles = {
  [EAuthModes.SIGN_IN]: {
    [EAuthSteps.EMAIL]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.OPTIONAL_SET_PASSWORD]: {
      header: "",
      subHeader: "",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.EMAIL]: {
      header: "Create your account",
      subHeader: "Start tracking your projects with Plane",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
    [EAuthSteps.OPTIONAL_SET_PASSWORD]: {
      header: "",
      subHeader: "",
    },
  },
};

const getHeaderSubHeader = (
  step: EAuthSteps,
  mode: EAuthModes,
  invitation?: IWorkspaceMemberInvitation | undefined,
  email?: string
) => {
  if (invitation && email && invitation.email === email && invitation.workspace) {
    const workspace = invitation.workspace;
    return {
      header: (
        <>
          Join <WorkspaceLogo logo={workspace?.logo} name={workspace?.name} classNames="w-8 h-9" /> {workspace.name}
        </>
      ),
      subHeader: `${
        mode == EAuthModes.SIGN_UP ? "Create an account" : "Sign in"
      } to start managing work with your team.`,
    };
  }

  return Titles[mode][step];
};

export const AuthRoot = observer((props: Props) => {
  const { mode } = props;
  //router
  const router = useRouter();
  const { email: emailParam, invitation_id, slug } = router.query;
  // states
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [invitation, setInvitation] = useState<IWorkspaceMemberInvitation | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  // hooks
  const { instance } = useInstance();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  const redirectToSignUp = (email: string) => {
    if (isEmpty(email)) router.push({ pathname: "/", query: router.query });
    else router.push({ pathname: "/", query: { ...router.query, email: email } });
  };

  const redirectToSignIn = (email: string) => {
    if (isEmpty(email)) router.push({ pathname: "/accounts/sign-in", query: router.query });
    else router.push({ pathname: "/accounts/sign-in", query: { ...router.query, email: email } });
  };

  useEffect(() => {
    if (invitation_id && slug) {
      setIsLoading(true);
      workSpaceService
        .getWorkspaceInvitation(slug.toString(), invitation_id.toString())
        .then((res) => {
          setInvitation(res);
        })
        .catch(() => {
          setInvitation(undefined);
        })
        .finally(() => setIsLoading(false));
    } else {
      setInvitation(undefined);
    }
  }, [invitation_id, slug]);

  const { header, subHeader } = getHeaderSubHeader(authStep, mode, invitation, email);

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    const emailCheck = mode === EAuthModes.SIGN_UP ? authService.signUpEmailCheck : authService.signInEmailCheck;

    await emailCheck(data)
      .then((res) => {
        if (mode === EAuthModes.SIGN_IN && !res.is_password_autoset) {
          setAuthStep(EAuthSteps.PASSWORD);
        } else {
          if (isSmtpConfigured) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
          } else {
            if (mode === EAuthModes.SIGN_IN) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Unable to process request please contact Administrator to reset password",
              });
            } else {
              setAuthStep(EAuthSteps.PASSWORD);
            }
          }
        }
      })
      .catch((err) => {
        if (err?.error_code === "USER_DOES_NOT_EXIST") {
          redirectToSignUp(data.email);
          return;
        } else if (err?.error_code === "USER_ALREADY_EXIST") {
          redirectToSignIn(data.email);
          return;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error_message ?? "Something went wrong. Please try again.",
        });
      });
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <>
      <div className="mx-auto flex flex-col">
        <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">{header}</h3>
          <p className="font-medium text-onboarding-text-400">{subHeader}</p>
        </div>
        {authStep === EAuthSteps.EMAIL && <AuthEmailForm defaultEmail={email} onSubmit={handleEmailVerification} />}
        {authStep === EAuthSteps.UNIQUE_CODE && (
          <UniqueCodeForm
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            submitButtonText="Continue"
            mode={mode}
          />
        )}
        {authStep === EAuthSteps.PASSWORD && (
          <AuthPasswordForm
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            handleStepChange={(step) => setAuthStep(step)}
            mode={mode}
          />
        )}
      </div>
      {isOAuthEnabled && authStep !== EAuthSteps.OPTIONAL_SET_PASSWORD && <OAuthOptions />}

      <TermsAndConditions isSignUp={mode === EAuthModes.SIGN_UP} />
    </>
  );
});
