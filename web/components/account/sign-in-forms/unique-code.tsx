import React, { useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
import { IEmailCheckData } from "@plane/types";
// services
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";

import { API_BASE_URL } from "@/helpers/common.helper";
// import { useEventTracker } from "@/hooks/store";

import useTimer from "@/hooks/use-timer";
import { AuthService } from "@/services/auth.service";
// import { UserService } from "@/services/user.service";
// hooks
// ui
// helpers
// types
// constants

type Props = {
  email: string;
  handleEmailClear: () => void;
  onSubmit: (isPasswordAutoset: boolean) => Promise<void>;
  submitButtonText: string;
};

type TUniqueCodeFormValues = {
  email: string;
  token: string;
};

const defaultValues: TUniqueCodeFormValues = {
  email: "",
  token: "",
};

// services
const authService = new AuthService();

export const SignInUniqueCodeForm: React.FC<Props> = (props) => {
  const { email,  handleEmailClear, submitButtonText } = props;
  // states
  const [uniqueCodeFormData, setUniqueCodeFormData] = useState<TUniqueCodeFormValues>({ ...defaultValues, email });
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  // store hooks
  // const { captureEvent } = useEventTracker();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(30);

  // const handleUniqueCodeSignIn = async (formData: TUniqueCodeFormValues) => {
  //   const payload: IMagicSignInData = {
  //     email: formData.email,
  //     key: `magic_${formData.email}`,
  //     token: formData.token,
  //   };

  //   await authService
  //     .magicSignIn(payload)
  //     .then(async () => {
  //       captureEvent(CODE_VERIFIED, {
  //         state: "SUCCESS",
  //       });
  //       const currentUser = await userService.currentUser();
  //       await onSubmit(currentUser.is_password_autoset);
  //     })
  //     .catch((err) => {
  //       captureEvent(CODE_VERIFIED, {
  //         state: "FAILED",
  //       });
  //       setToast({
  //         type: TOAST_TYPE.ERROR,
  //         title: "Error!",
  //         message: err?.error ?? "Something went wrong. Please try again.",
  //       });
  //     });
  // };

  const handleFormChange = (key: keyof TUniqueCodeFormValues, value: string) =>
    setUniqueCodeFormData((prev) => ({ ...prev, [key]: value }));

  const handleSendNewCode = async (formData: TUniqueCodeFormValues) => {
    const payload: IEmailCheckData = {
      email: formData.email,
    };

    await authService
      .generateUniqueCode(payload)
      .then(() => {
        setResendCodeTimer(30);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "A new unique code has been sent to your email.",
        });
        handleFormChange("token", "");
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleRequestNewCode = async () => {
    setIsRequestingNewCode(true);

    await handleSendNewCode(uniqueCodeFormData)
      .then(() => setResendCodeTimer(30))
      .finally(() => setIsRequestingNewCode(false));
  };

  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;

  return (
    <>
      <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
        <h3 className="text-3xl font-bold text-onboarding-text-100">Sign in to Plane</h3>
        <p className="font-medium text-onboarding-text-400">Get back to your projects and make progress</p>
      </div>
      <form
        className="mx-auto mt-5 space-y-4 sm:w-96"
        method="POST"
        action={`${API_BASE_URL}/api/instances/admins/sign-up/`}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-onboarding-text-300" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              id="email"
              name="email"
              type="email"
              value={uniqueCodeFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              // hasError={Boolean(errors.email)}
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
              disabled
            />
            {uniqueCodeFormData.email.length > 0 && (
              <XCircle
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={handleEmailClear}
              />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-onboarding-text-300" htmlFor="token">
            Unique code <span className="text-red-500">*</span>
          </label>
          <Input
            name="token"
            value={uniqueCodeFormData.token}
            onChange={(e) => handleFormChange("token", e.target.value)}
            // hasError={Boolean(errors.token)}
            placeholder="gets-sets-flys"
            className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
            autoFocus
          />
          <div className="flex w-full items-center justify-between px-1 text-xs">
            <p className="flex items-center gap-1 font-medium text-green-700">
              <CircleCheck height={12} width={12} />
              Paste the code sent to your email
            </p>
            <button
              type="button"
              onClick={handleRequestNewCode}
              className={`${
                isRequestNewCodeDisabled
                  ? "text-onboarding-text-400"
                  : "font-medium text-custom-primary-300 hover:text-custom-primary-200"
              }`}
              disabled={isRequestNewCodeDisabled}
            >
              {resendTimerCode > 0
                ? `Resend in ${resendTimerCode}s`
                : isRequestingNewCode
                ? "Requesting new code"
                : "Resend"}
            </button>
          </div>
        </div>
        {/* <Button type="submit" variant="primary" className="w-full" size="lg" disabled={!isValid} loading={isSubmitting}> */}
        <Button type="submit" variant="primary" className="w-full" size="lg">
          {submitButtonText}
        </Button>
      </form>
    </>
  );
};
