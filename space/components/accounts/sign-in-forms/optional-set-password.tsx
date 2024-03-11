import React, { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// constants
import { ESignInSteps } from "components/accounts";

type Props = {
  email: string;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
  isOnboarded: boolean;
};

export const OptionalSetPasswordForm: React.FC<Props> = (props) => {
  const { email, handleStepChange, handleSignInRedirection, isOnboarded } = props;
  // states
  const [isGoingToWorkspace, setIsGoingToWorkspace] = useState(false);
  // form info
  const {
    control,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleGoToWorkspace = async () => {
    setIsGoingToWorkspace(true);

    await handleSignInRedirection().finally(() => setIsGoingToWorkspace(false));
  };

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">Set a password</h1>
      <p className="mt-2.5 px-20 text-center text-sm text-onboarding-text-200">
        If you{"'"}d like to do away with codes, set a password here.
      </p>

      <form className="mx-auto mt-5 space-y-4 sm:w-96">
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            validate: (value) => checkEmailValidity(value) || "Email is invalid",
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="email"
              name="email"
              type="email"
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={Boolean(errors.email)}
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 pr-12 text-onboarding-text-400"
              disabled
            />
          )}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => handleStepChange(ESignInSteps.CREATE_PASSWORD)}
            className="w-full"
            size="xl"
            disabled={!isValid}
          >
            Create password
          </Button>
          <Button
            type="button"
            variant="outline-primary"
            className="w-full"
            size="xl"
            onClick={handleGoToWorkspace}
            disabled={!isValid}
            loading={isGoingToWorkspace}
          >
            {isOnboarded ? "Go to board" : "Set up profile"}
          </Button>
        </div>
        <p className="text-xs text-onboarding-text-200">
          When you click{" "}
          <span className="text-custom-primary-100">{isOnboarded ? "Go to board" : "Set up profile"}</span> above, you
          agree with our{" "}
          <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
            <span className="font-semibold underline">terms and conditions of service.</span>
          </Link>
        </p>
      </form>
    </>
  );
};
