import React from "react";
import { Controller, useForm } from "react-hook-form";
import { CornerDownLeft, XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IEmailCheckData, IPasswordSignInData } from "types/auth";
// constants
import { ESignInSteps } from "components/account";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
  handleNextStep: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
};

type TPasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TPasswordFormValues = {
  email: "",
  password: "",
};

const authService = new AuthService();

export const PasswordForm: React.FC<Props> = (props) => {
  const { email, updateEmail, handleNextStep, handleSignInRedirection } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    reset,
    setError,
  } = useForm<TPasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handlePasswordSignIn = async (formData: TPasswordFormValues) => {
    const payload: IPasswordSignInData = {
      email: formData.email,
      password: formData.password,
    };

    await authService
      .passwordSignIn(payload)
      .then(async () => await handleSignInRedirection())
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleEmailCheck = async (formData: TPasswordFormValues) => {
    const payload: IEmailCheckData = {
      email: formData.email,
      type: "password",
    };

    await authService
      .emailCheck(payload)
      .then((res) => {
        if (res.is_password_autoset) handleNextStep(ESignInSteps.SET_PASSWORD_LINK);
        else
          reset({
            email: formData.email,
            password: "",
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

  const handleFormSubmit = async (formData: TPasswordFormValues) => {
    if (dirtyFields.email) await handleEmailCheck(formData);
    else await handlePasswordSignIn(formData);
  };

  const handleForgotPassword = async () => {
    const emailFormValue = getValues("email");

    const isEmailValid = checkEmailValidity(emailFormValue);

    if (!isEmailValid) {
      setError("email", { message: "Email is invalid" });
      return;
    }

    authService
      .sendResetPasswordLink({ email: emailFormValue })
      .then(() => handleNextStep(ESignInSteps.SET_PASSWORD_LINK))
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-11 sm:w-96 mx-auto space-y-4">
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
              Hit <CornerDownLeft className="h-2.5 w-2.5" /> to get a new code
            </button>
          )}
        </div>
        <div>
          <Controller
            control={control}
            name="password"
            rules={{
              required: dirtyFields.email ? false : "Password is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                type="password"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.password)}
                placeholder="Enter password"
                className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
              />
            )}
          />
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs font-medium text-right w-full text-custom-primary-100"
          >
            Forgot your password?
          </button>
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Go to workspace"}
        </Button>
      </form>
    </>
  );
};
