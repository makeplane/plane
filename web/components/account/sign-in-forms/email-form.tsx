import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { XCircle, X } from "lucide-react";
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
  // states
  const [emailErrorToast, setEmailErrorToast] = useState(false);

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
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        Create or join a workspace. Start with your e-mail.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto mt-8 space-y-4 sm:w-96">
        <div className="space-y-1">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <div className="flex transition-all">
                <div
                  className={`relative flex-grow flex items-center rounded-[4.5px] bg-onboarding-background-200 border-0 ${
                    errors.email
                      ? "!border-2 border-red-200"
                      : "focus-within:!border-2 focus-within:border-custom-primary-30 "
                  }`}
                >
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={value}
                    onChange={(event) => {
                      if (errors.email && !emailErrorToast) setEmailErrorToast(true);
                      onChange(event.target.value);
                    }}
                    ref={ref}
                    hasError={Boolean(errors.email)}
                    placeholder="orville.wright@frstflt.com"
                    className={`h-[46px] w-full !rounded-[3.5px] !border ${
                      errors.email ? "!border-red-400" : "focus:border-custom-primary-100"
                    } pr-12 placeholder:text-onboarding-text-400`}
                  />
                  {value.length > 0 && (
                    <XCircle
                      className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => onChange("")}
                    />
                  )}
                </div>
                {errors.email && emailErrorToast && (
                  <div className="absolute ml-[400px] w-full transition-all">
                    <div className="relative px-2 gap-x-2 flex w-fit h-10 bg-red-50 rounded-[4px] border border-red-200">
                      {"🤥"}
                      <div>
                        <X
                          className="right-1 top-1 absolute h-2.5 w-2.5 hover:cursor-pointer stroke-custom-text-400"
                          onClick={() => setEmailErrorToast(false)}
                        />
                        <p className="mt-1 text-[10px]">That doesn{"’"}t look like an email address.</p>
                        <p className="mt-1 text-[10px]">Sometimes, we miss an @ or a . Make sure you have it right.</p>
                      </div>
                    </div>
                  </div>
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
