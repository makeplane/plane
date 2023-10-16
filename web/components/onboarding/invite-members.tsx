import React, { useEffect, useRef, useState } from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// react-hook-form
import { Control, Controller, FieldArrayWithId, UseFieldArrayRemove, useFieldArray, useForm } from "react-hook-form";
// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { PlusIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "types";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
};

type EmailRole = {
  email: string;
  role: 5 | 10 | 15 | 20;
};

type FormValues = {
  emails: EmailRole[];
};

type InviteMemberFormProps = {
  index: number;
  remove: UseFieldArrayRemove;
  control: Control<FormValues, any>;
  field: FieldArrayWithId<FormValues, "emails", "id">;
  fields: FieldArrayWithId<FormValues, "emails", "id">[];
  errors: any;
};

// services
const workspaceService = new WorkspaceService();

const InviteMemberForm: React.FC<InviteMemberFormProps> = (props) => {
  const { control, index, fields, remove, errors } = props;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useDynamicDropdownPosition(isDropdownOpen, () => setIsDropdownOpen(false), buttonRef, dropdownRef);

  return (
    <div className="group relative grid grid-cols-11 gap-4">
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
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id={`emails.${index}.email`}
              name={`emails.${index}.email`}
              type="text"
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={Boolean(errors.emails?.[index]?.email)}
              placeholder="Enter their email..."
              className="text-xs sm:text-sm w-full"
            />
          )}
        />
      </div>
      <div className="col-span-3">
        <Controller
          control={control}
          name={`emails.${index}.role`}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <Listbox
              as="div"
              value={value}
              onChange={(val) => {
                onChange(val);
                setIsDropdownOpen(false);
              }}
              className="flex-shrink-0 text-left w-full"
            >
              <Listbox.Button
                type="button"
                ref={buttonRef}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center px-2.5 py-2 text-xs justify-between gap-1 w-full rounded-md border border-custom-border-300 shadow-sm duration-300 focus:outline-none"
              >
                <span className="text-xs sm:text-sm">{ROLE[value]}</span>
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              </Listbox.Button>

              <Transition
                show={isDropdownOpen}
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Listbox.Options
                  ref={dropdownRef}
                  className="fixed w-36 z-10 border border-custom-border-300 mt-1 overflow-y-auto rounded-md bg-custom-background-90 text-xs shadow-lg focus:outline-none max-h-48"
                >
                  <div className="space-y-1 p-2">
                    {Object.entries(ROLE).map(([key, value]) => (
                      <Listbox.Option
                        key={key}
                        value={parseInt(key)}
                        className={({ active, selected }) =>
                          `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                            active || selected ? "bg-custom-background-80" : ""
                          } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">{value}</div>
                            {selected && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </div>
                </Listbox.Options>
              </Transition>
            </Listbox>
          )}
        />
      </div>
      {fields.length > 1 && (
        <button
          type="button"
          className="hidden group-hover:grid self-center place-items-center rounded -ml-3"
          onClick={() => remove(index)}
        >
          <XMarkIcon className="h-3.5 w-3.5 text-custom-text-200" />
        </button>
      )}
    </div>
  );
};

export const InviteMembers: React.FC<Props> = (props) => {
  const { finishOnboarding, stepChange, user, workspace } = props;

  const { setToastAlert } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors, isValid },
  } = useForm<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emails",
  });

  const nextStep = async () => {
    const payload: Partial<TOnboardingSteps> = {
      workspace_invite: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await finishOnboarding();
  };

  const onSubmit = async (formData: FormValues) => {
    if (!workspace) return;

    const payload = { ...formData };

    await workspaceService
      .inviteWorkspace(workspace.slug, payload, user)
      .then(async () => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });

        await nextStep();
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
      className="w-full space-y-7 sm:space-y-10 overflow-hidden flex flex-col"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold">Invite people to collaborate</h2>
      <div className="md:w-3/5 text-sm h-full max-h-[40vh] flex flex-col overflow-hidden">
        <div className="grid grid-cols-11 gap-x-4 mb-1 text-sm">
          <h6 className="col-span-7">Co-workers Email</h6>
          <h6 className="col-span-4">Role</h6>
        </div>
        <div className="space-y-3 sm:space-y-4 mb-3 h-full overflow-y-auto">
          {fields.map((field, index) => (
            <InviteMemberForm
              control={control}
              errors={errors}
              field={field}
              fields={fields}
              index={index}
              remove={remove}
              key={field.id}
            />
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 outline-custom-primary-100 bg-transparent text-custom-primary-100 text-xs font-medium py-2 pr-3"
          onClick={appendField}
        >
          <PlusIcon className="h-3 w-3" />
          Add another
        </button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="primary" type="submit" disabled={!isValid} loading={isSubmitting} size="md">
          {isSubmitting ? "Sending..." : "Send Invite"}
        </Button>
        <Button variant="neutral-primary" size="md" onClick={nextStep}>
          Skip this step
        </Button>
      </div>
    </form>
  );
};
