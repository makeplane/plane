import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CornerDownLeft, XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
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
import { ESignInSteps } from "components/account";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
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
  const { email, updateEmail, handleStepChange, handleSignInRedirection } = props;
  // states
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  // toast alert
  const { setToastAlert } = useToast();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer();
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    reset,
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

  const handleSendNewLink = async (formData: TUniqueCodeFormValues) => {
    const payload: IEmailCheckData = {
      email: formData.email,
      type: "magic_code",
    };

    await authService
      .emailCheck(payload)
      .then(() => {
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
    if (dirtyFields.email) await handleSendNewLink(formData);
    else await handleUniqueCodeSignIn(formData);
  };

  const handleRequestNewCode = async () => {
    setIsRequestingNewCode(true);

    await handleSendNewLink(getValues())
      .then(() => setResendCodeTimer(30))
      .finally(() => setIsRequestingNewCode(false));
  };

  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
        Moving to the runway
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 px-20 mt-3">
        Paste the code you got at <span className="font-medium text-custom-primary-100">{email}</span> below.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 sm:w-96 mx-auto space-y-4">
        <div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <div className="flex items-center relative rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={(e) => {
                    updateEmail(e.target.value);
                    onChange(e.target.value);
                  }}
                  onBlur={() => {
                    if (dirtyFields.email) handleSendNewLink(getValues());
                  }}
                  ref={ref}
                  hasError={Boolean(errors.email)}
                  placeholder="orville.wright@firstflight.com"
                  className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
                />
                {value.length > 0 && (
                  <XCircle
                    className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                    onClick={() => onChange("")}
                  />
                )}
              </div>
            )}
          />
          {dirtyFields.email && (
            <button
              type="submit"
              className="text-xs text-onboarding-text-300 mt-1.5 flex items-center gap-1 outline-none bg-transparent border-none"
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
              required: dirtyFields.email ? false : "Code is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.token)}
                placeholder="gets-sets-fays"
                className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
              />
            )}
          />
          <button
            type="button"
            onClick={handleRequestNewCode}
            className={`text-xs text-right w-full text-onboarding-text-200 ${
              isRequestNewCodeDisabled ? "" : "hover:text-custom-primary-100"
            }`}
            disabled={isRequestNewCodeDisabled}
          >
            {resendTimerCode > 0
              ? `Request new code in ${resendTimerCode}s`
              : isRequestingNewCode
              ? "Requesting new code..."
              : "Request new code"}
          </button>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="xl"
          disabled={!isValid || dirtyFields.email}
          loading={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Confirm"}
        </Button>
      </form>
    </>
  );
};
