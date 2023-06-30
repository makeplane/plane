import React, { useEffect } from "react";

import useSWR from "swr";

// react-hook-form
import { Controller, useFieldArray, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, Input, PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import { ICurrentUserResponse } from "types";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number | null>>;
  updateLastWorkspace: () => Promise<void>;
  workspace: any;
  user: ICurrentUserResponse | undefined;
};

type EmailRole = {
  email: string;
  role: 5 | 10 | 15 | 20;
};

type FormValues = {
  emails: EmailRole[];
};

export const InviteMembers: React.FC<Props> = ({
  setStep,
  workspace,
  updateLastWorkspace,
  user,
}) => {
  const { setToastAlert } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emails",
  });

  const { data: invitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const goToNextStep = () => {
    if (invitations && invitations.length > 0) setStep(4);
    else updateLastWorkspace();
  };

  const onSubmit = async (formData: FormValues) => {
    const payload = { ...formData };

    await workspaceService
      .inviteWorkspace(workspace.slug, payload, user)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });

        goToNextStep();
      })
      .catch((err) => console.log(err));
  };

  const appendField = () => {
    append({ email: "", role: 15 });
  };

  useEffect(() => {
    if (fields.length === 0) {
      append([
        { email: "", role: 15 },
        { email: "", role: 15 },
        { email: "", role: 15 },
      ]);
    }
  }, [fields, append]);

  return (
    <form
      className="w-full mt-6"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <div className="space-y-10">
        <h2 className="text-2xl font-semibold">Invite people to collaborate</h2>
        <div className="md:w-2/5 text-sm">
          <div className="grid grid-cols-11 gap-x-4 mb-1 text-sm">
            <h6 className="col-span-7">Co-workers Email</h6>
            <h6 className="col-span-4">Role</h6>
          </div>
          <div className="space-y-4 mb-3">
            {fields.map((field, index) => (
              <div key={field.id} className="group relative grid grid-cols-11 gap-4">
                <div className="col-span-7">
                  <Controller
                    control={control}
                    name={`emails.${index}.email`}
                    rules={{
                      required: "Email ID is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid Email ID",
                      },
                    }}
                    render={({ field }) => (
                      <>
                        <Input {...field} placeholder="Enter their email..." />
                        {errors.emails?.[index]?.email && (
                          <span className="text-red-500 text-xs">
                            {errors.emails?.[index]?.email?.message}
                          </span>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <Controller
                    control={control}
                    name={`emails.${index}.role`}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        label={ROLE[value]}
                        onChange={onChange}
                        width="w-full"
                        input
                      >
                        {Object.entries(ROLE).map(([key, value]) => (
                          <CustomSelect.Option key={key} value={parseInt(key)}>
                            {value}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="hidden group-hover:grid self-center place-items-center rounded -ml-3"
                    onClick={() => remove(index)}
                  >
                    <XMarkIcon className="h-3.5 w-3.5 text-brand-secondary" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 outline-brand-accent bg-transparent text-brand-accent text-xs font-medium py-2 pr-3"
            onClick={appendField}
          >
            <PlusIcon className="h-3 w-3" />
            Add more
          </button>
        </div>
        <div className="flex items-center gap-4">
          <PrimaryButton type="submit" loading={isSubmitting} size="md">
            {isSubmitting ? "Sending..." : "Send Invite"}
          </PrimaryButton>
          <SecondaryButton size="md" onClick={goToNextStep} outline>
            Skip this step
          </SecondaryButton>
        </div>
      </div>
    </form>
  );
};
