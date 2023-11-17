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
import { Check, ChevronDown, Plus, X, XCircle } from "lucide-react";
// types
import { IUser, IWorkspace, TOnboardingSteps, TUserWorkspaceRole } from "types";
// constants
import { ROLE } from "constants/workspace";
import OnboardingStepIndicator from "components/account/step-indicator";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
};

type EmailRole = {
  email: string;
  role: TUserWorkspaceRole;
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
              className="text-xs sm:text-sm w-full h-11 placeholder:text-custom-text-400/50"
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
                className="flex items-center px-2.5 h-11 py-2 text-xs justify-between gap-1 w-full rounded-md border border-custom-border-200 duration-300"
              >
                <span className="text-xs sm:text-sm">{ROLE[value]}</span>

                <ChevronDown className="h-4 w-4" />
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
                  className="fixed w-36 z-10 border border-custom-border-200 mt-1 overflow-y-auto rounded-md bg-custom-background-90 text-xs shadow-lg focus:outline-none max-h-48"
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
                            {selected && <Check className="h-4 w-4 flex-shrink-0" />}
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
          className="hidden group-hover:grid self-center place-items-center rounded ml-3"
          onClick={() => remove(index)}
        >
          <XCircle className="h-3.5 w-3.5 text-custom-text-400" />
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
    <div className="flex py-14">
      <div className="hidden lg:block w-1/4 p-3 ml-auto rounded bg-gradient-to-b from-white to-custom-primary-10/30 border border-custom-border-100">
        <p className="text-base text-custom-text-400 font-semibold">Members</p>

        {Array.from({ length: 4 }).map(() => (
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-custom-primary-10"></div>
            <div className="w-full">
              <div className="rounded-md h-2.5 my-2 bg-custom-primary-30 w-2/3" />
              <div className="rounded-md h-2 bg-custom-primary-20 w-1/2" />
            </div>
          </div>
        ))}

        <div className="relative mt-20 h-32">
          <div className="flex absolute bg-custom-background-100 p-2 rounded-full gap-x-2 border border-custom-border-200 w-full mt-1 -left-1/2">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-custom-primary-10"></div>
            <div>
              <p className="text-sm font-medium">Murphy cooper</p>
              <p className="text-custom-text-400 text-sm">murphy@plane.so</p>
            </div>
          </div>

          <div className="flex absolute bg-custom-background-100 p-2 rounded-full gap-x-2 border border-custom-border-200 -left-1/3 mt-14 w-full">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-custom-primary-10"></div>
            <div>
              <p className="text-sm font-medium">Else Thompson</p>
              <p className="text-custom-text-400 text-sm">Elsa@plane.so</p>
            </div>
          </div>
        </div>
      </div>
      <form
        className="px-7 sm:px-0 md:w-4/5 lg:w-1/2  mx-auto space-y-7 sm:space-y-10 overflow-hidden flex flex-col"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.code === "Enter") e.preventDefault();
        }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-semibold">Invite your team to work with you</h2>
          <OnboardingStepIndicator step={2} />
        </div>

        <div className="md:w-4/5 text-sm flex flex-col overflow-hidden">
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
            className="flex items-center gap-2 outline-custom-primary-100 bg-transparent text-custom-primary-100 text-sm font-semibold py-2 pr-3"
            onClick={appendField}
          >
            <Plus className="h-3 w-3" />
            Add another
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="primary" type="submit" disabled={!isValid} loading={isSubmitting} size="md">
            {isSubmitting ? "Sending..." : "Send Invite"}
          </Button>
          {/* <Button variant="outline-primary" size="md" onClick={nextStep}>
            Copy invite link
          </Button> */}

          <span className="text-sm text-custom-text-400/50 hover:cursor-pointer" onClick={nextStep}>
            Do this later
          </span>
        </div>
      </form>
    </div>
  );
};
