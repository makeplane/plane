import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { CornerDownLeft, XCircle } from "lucide-react";
// services
import { AuthService } from "services/authentication.service";
import { UserService } from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IEmailCheckData, IMagicSignInData } from "types/auth";
// constants
import { ESignInSteps } from "components/accounts";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
  submitButtonLabel?: string;
  showTermsAndConditions?: boolean;
  updateUserOnboardingStatus: (value: boolean) => void;
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
const userService = new UserService();

export const UniqueCodeForm: React.FC<Props> = (props) => {
  const {
    email,
    updateEmail,
    handleStepChange,
    handleSignInRedirection,
    submitButtonLabel = "Continue",
    showTermsAndConditions = false,
    updateUserOnboardingStatus,
  } = props;
  // states
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  // toast alert
  const { setToastAlert } = useToast();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(30);
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    reset,
    setFocus,
  } = useForm<TUniqueCodeFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleUniqueCodeSignIn = async (formData: TUniqueCodeFormValues) => {
    const payload: IMagicSignInData = {
      email: formData.email,
      key: `magic_${formData.email}`,
      token: formData.token,
    };

    await authService
      .magicSignIn(payload)
      .then(async () => {
        const currentUser = await userService.currentUser();

        updateUserOnboardingStatus(currentUser.onboarding_step.profile_complete ?? false);

        if (currentUser.is_password_autoset) handleStepChange(ESignInSteps.OPTIONAL_SET_PASSWORD);
        else await handleSignInRedirection();
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleSendNewCode = async (formData: TUniqueCodeFormValues) => {
    const payload: IEmailCheckData = {
      email: formData.email,
    };

    await authService
      .generateUniqueCode(payload)
      .then(() => {
        setResendCodeTimer(30);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "A new unique code has been sent to your email.",
        });

        reset({
          email: formData.email,
          token: "",
        });
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleFormSubmit = async (formData: TUniqueCodeFormValues) => {
    updateEmail(formData.email);

    if (dirtyFields.email) await handleSendNewCode(formData);
    else await handleUniqueCodeSignIn(formData);
  };

  const handleRequestNewCode = async () => {
    setIsRequestingNewCode(true);

    await handleSendNewCode(getValues())
      .then(() => setResendCodeTimer(30))
      .finally(() => setIsRequestingNewCode(false));
  };

  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;
  const hasEmailChanged = dirtyFields.email;

  useEffect(() => {
    setFocus("token");
  }, [setFocus]);

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        Paste the code you got at <span className="font-semibold text-custom-primary-100">{email}</span> below.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto mt-5 space-y-4 sm:w-96">
        <div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  onBlur={() => {
                    if (hasEmailChanged) handleSendNewCode(getValues());
                  }}
                  ref={ref}
                  hasError={Boolean(errors.email)}
                  placeholder="name@company.com"
                  className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                />
                {value.length > 0 && (
                  <XCircle
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => onChange("")}
                  />
                )}
              </div>
            )}
          />
          {hasEmailChanged && (
            <button
              type="submit"
              className="mt-1.5 flex items-center gap-1 border-none bg-transparent text-xs text-onboarding-text-300 outline-none"
            >
              Hit <CornerDownLeft className="h-2.5 w-2.5" /> or <span className="italic">Tab</span> to get a new code
            </button>
          )}
        </div>
        <div>
          <Controller
            control={control}
            name="token"
            rules={{
              required: hasEmailChanged ? false : "Code is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.token)}
                placeholder="gets-sets-flys"
                className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              />
            )}
          />
          <div className="w-full text-right">
            <button
              type="button"
              onClick={handleRequestNewCode}
              className={`text-xs ${
                isRequestNewCodeDisabled
                  ? "text-onboarding-text-300"
                  : "text-onboarding-text-200 hover:text-custom-primary-100"
              }`}
              disabled={isRequestNewCodeDisabled}
            >
              {resendTimerCode > 0
                ? `Request new code in ${resendTimerCode}s`
                : isRequestingNewCode
                  ? "Requesting new code"
                  : "Request new code"}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="xl"
          disabled={!isValid || hasEmailChanged}
          loading={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
        {showTermsAndConditions && (
          <p className="text-xs text-onboarding-text-200">
            When you click the button above, you agree with our{" "}
            <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              <span className="font-semibold underline">terms and conditions of service.</span>
            </Link>
          </p>
        )}
      </form>
    </>
  );
};
