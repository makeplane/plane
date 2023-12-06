import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IPasswordSignInData } from "types/auth";
// constants
import { ESignInSteps } from "components/account";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
  handleStepChange: (step: ESignInSteps) => void;
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
  const { email, updateEmail, handleStepChange, handleSignInRedirection } = props;
  // states
  const [isSendingUniqueCode, setIsSendingUniqueCode] = useState(false);
  const [isSendingResetPasswordLink, setIsSendingResetPasswordLink] = useState(false);
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    setError,
    setFocus,
  } = useForm<TPasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleFormSubmit = async (formData: TPasswordFormValues) => {
    updateEmail(formData.email);

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

  const handleForgotPassword = async () => {
    const emailFormValue = getValues("email");

    const isEmailValid = checkEmailValidity(emailFormValue);

    if (!isEmailValid) {
      setError("email", { message: "Email is invalid" });
      return;
    }

    setIsSendingResetPasswordLink(true);

    authService
      .sendResetPasswordLink({ email: emailFormValue })
      .then(() => handleStepChange(ESignInSteps.SET_PASSWORD_LINK))
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsSendingResetPasswordLink(false));
  };

  const handleSendUniqueCode = async () => {
    const emailFormValue = getValues("email");

    const isEmailValid = checkEmailValidity(emailFormValue);

    if (!isEmailValid) {
      setError("email", { message: "Email is invalid" });
      return;
    }

    setIsSendingUniqueCode(true);

    await authService
      .generateUniqueCode({ email: emailFormValue })
      .then(() => handleStepChange(ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD))
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsSendingUniqueCode(false));
  };

  useEffect(() => {
    setFocus("password");
  }, [setFocus]);

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
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center relative rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
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
                className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12 !bg-onboarding-background-200"
              />
            )}
          />
          <div className="w-full text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className={`text-xs font-medium ${
                isSendingResetPasswordLink ? "text-onboarding-text-300" : "text-custom-primary-100"
              }`}
              disabled={isSendingResetPasswordLink}
            >
              {isSendingResetPasswordLink ? "Sending link" : "Forgot your password?"}
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <Button
            type="button"
            onClick={handleSendUniqueCode}
            variant="primary"
            className="w-full"
            size="xl"
            loading={isSendingUniqueCode}
          >
            {isSendingUniqueCode ? "Sending code" : "Use unique code"}
          </Button>
          <Button
            type="submit"
            variant="outline-primary"
            className="w-full"
            size="xl"
            disabled={!isValid}
            loading={isSubmitting}
          >
            Go to workspace
          </Button>
        </div>
        <p className="text-xs text-onboarding-text-200">
          When you click <span className="text-custom-primary-100">Go to workspace</span> above, you agree with our{" "}
          <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
            <span className="font-semibold underline">terms and conditions of service.</span>
          </Link>
        </p>
      </form>
    </>
  );
};
