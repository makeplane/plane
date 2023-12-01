import React, { useState } from "react";
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
import { IEmailCheckData, TEmailCheckTypes } from "types/auth";
// constants
import { ESignInSteps } from "components/account";

type Props = {
  handleStepChange: (step: ESignInSteps) => void;
  updateEmail: (email: string) => void;
};

type TEmailCodeFormValues = {
  email: string;
};

const authService = new AuthService();

export const EmailForm: React.FC<Props> = (props) => {
  const { handleStepChange, updateEmail } = props;
  // states
  const [isCheckingEmail, setIsCheckingEmail] = useState<TEmailCheckTypes | null>(null);

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    watch,
  } = useForm<TEmailCodeFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleEmailCheck = async (type: TEmailCheckTypes) => {
    setIsCheckingEmail(type);

    const email = watch("email");

    const payload: IEmailCheckData = {
      email,
      type,
    };

    // update the global email state
    updateEmail(email);

    await authService
      .emailCheck(payload)
      .then((res) => {
        // if type is magic_code, send the user to magic sign in
        if (type === "magic_code") handleStepChange(ESignInSteps.UNIQUE_CODE);
        // if type is password, check if the user has a password set
        if (type === "password") {
          // if password is autoset, send them to set new password link
          if (res.is_password_autoset) handleStepChange(ESignInSteps.SET_PASSWORD_LINK);
          // if password is not autoset, send them to password form
          else handleStepChange(ESignInSteps.PASSWORD);
        }
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsCheckingEmail(null));
  };

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
        Get on your flight deck!
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 px-20 mt-3">
        Sign in with the email you used to sign up for Plane
      </p>

      <form onSubmit={handleSubmit(() => {})} className="mt-5 sm:w-96 mx-auto">
        <div className="space-y-1">
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
                  onChange={onChange}
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
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            size="xl"
            onClick={() => handleEmailCheck("magic_code")}
            disabled={!isValid}
            loading={Boolean(isCheckingEmail)}
          >
            {isCheckingEmail === "magic_code" ? "Sending code..." : "Send unique code"}
          </Button>
          <Button
            type="button"
            variant="outline-primary"
            className="w-full"
            size="xl"
            onClick={() => handleEmailCheck("password")}
            disabled={!isValid}
            loading={Boolean(isCheckingEmail)}
          >
            {isCheckingEmail === "password" ? "Loading..." : "Use password"}
          </Button>
        </div>
      </form>
    </>
  );
};
