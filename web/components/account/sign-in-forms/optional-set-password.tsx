import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// constants
import { ESignInSteps } from "components/account";

type Props = {
  email: string;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
};

export const OptionalSetPasswordForm: React.FC<Props> = (props) => {
  const { email, handleStepChange, handleSignInRedirection } = props;
  // states
  const [isGoingToWorkspace, setIsGoingToWorkspace] = useState(false);

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
      <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">Set a password</h1>
      <p className="text-center text-sm text-onboarding-text-200 px-20 mt-3">
        If you{"'"}d to do away with codes, set a password here.
      </p>

      <form className="mt-5 sm:w-96 mx-auto">
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
              placeholder="orville.wright@firstflight.com"
              className="w-full h-[46px] text-onboarding-text-400 border border-onboarding-border-100 pr-12"
              disabled
            />
          )}
        />
        <div className="grid grid-cols-2 gap-2.5 mt-4">
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
            {isGoingToWorkspace ? "Going to app..." : "Go to workspace"}
          </Button>
        </div>
      </form>
    </>
  );
};
