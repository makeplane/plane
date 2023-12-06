import React, { useEffect } from "react";
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
import { IEmailCheckData } from "types/auth";
// constants
import { ESignInSteps } from "components/account";

type Props = {
  handleStepChange: (step: ESignInSteps) => void;
  updateEmail: (email: string) => void;
};

type TEmailFormValues = {
  email: string;
};

const authService = new AuthService();

export const EmailForm: React.FC<Props> = (props) => {
  const { handleStepChange, updateEmail } = props;

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    setFocus,
  } = useForm<TEmailFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleFormSubmit = async (data: TEmailFormValues) => {
    const payload: IEmailCheckData = {
      email: data.email,
    };

    // update the global email state
    updateEmail(data.email);

    await authService
      .emailCheck(payload)
      .then((res) => {
        // if the password has been autoset, send the user to magic sign-in
        if (res.is_password_autoset) handleStepChange(ESignInSteps.UNIQUE_CODE);
        // if the password has not been autoset, send them to password sign-in
        else handleStepChange(ESignInSteps.PASSWORD);
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 mt-2.5">
        Create or join a workspace. Start with your e-mail.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 sm:w-96 mx-auto space-y-4">
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
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          Continue
        </Button>
      </form>
    </>
  );
};
