import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Listbox, Transition } from "@headlessui/react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Check, ChevronDown, Plus, XCircle } from "lucide-react";
// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// components
import { OnboardingStepIndicator } from "components/onboarding/step-indicator";
// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// constants
import { EUserWorkspaceRoles, ROLE } from "constants/workspace";
// assets
import user1 from "public/users/user-1.png";
import user2 from "public/users/user-2.png";
import userDark from "public/onboarding/user-dark.svg";
import userLight from "public/onboarding/user-light.svg";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
};

type EmailRole = {
  email: string;
  role: EUserWorkspaceRoles;
  role_active: boolean;
};

type FormValues = {
  emails: EmailRole[];
};

type InviteMemberFormProps = {
  index: number;
  remove: UseFieldArrayRemove;
  control: Control<FormValues, any>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  watch: UseFormWatch<FormValues>;
  field: FieldArrayWithId<FormValues, "emails", "id">;
  fields: FieldArrayWithId<FormValues, "emails", "id">[];
  errors: any;
  isInvitationDisabled: boolean;
  setIsInvitationDisabled: (value: boolean) => void;
};

// services
const workspaceService = new WorkspaceService();
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const placeholderEmails = [
  "charlie.taylor@frstflt.com",
  "octave.chanute@frstflt.com",
  "george.spratt@frstflt.com",
  "frank.coffyn@frstflt.com",
  "amos.root@frstflt.com",
  "edward.deeds@frstflt.com",
  "charles.m.manly@frstflt.com",
  "glenn.curtiss@frstflt.com",
  "thomas.selfridge@frstflt.com",
  "albert.zahm@frstflt.com",
];
const InviteMemberForm: React.FC<InviteMemberFormProps> = (props) => {
  const {
    control,
    index,
    fields,
    remove,
    errors,
    isInvitationDisabled,
    setIsInvitationDisabled,
    setValue,
    getValues,
    watch,
  } = props;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useDynamicDropdownPosition(isDropdownOpen, () => setIsDropdownOpen(false), buttonRef, dropdownRef);

  const email = watch(`emails.${index}.email`);

  const emailOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === "") {
      const validEmail = fields.map((_, i) => emailRegex.test(getValues(`emails.${i}.email`))).includes(true);
      if (validEmail) {
        setIsInvitationDisabled(false);
      } else {
        setIsInvitationDisabled(true);
      }

      if (getValues(`emails.${index}.role_active`)) {
        setValue(`emails.${index}.role_active`, false);
      }
    } else {
      if (!getValues(`emails.${index}.role_active`)) {
        setValue(`emails.${index}.role_active`, true);
      }
      if (isInvitationDisabled && emailRegex.test(event.target.value)) {
        setIsInvitationDisabled(false);
      } else if (!isInvitationDisabled && !emailRegex.test(event.target.value)) {
        setIsInvitationDisabled(true);
      }
    }
  };

  return (
    <div>
      <div className="group relative grid grid-cols-11 gap-4">
        <div className="col-span-7 rounded-md bg-onboarding-background-200">
          <Controller
            control={control}
            name={`emails.${index}.email`}
            rules={{
              pattern: {
                value: emailRegex,
                message: "Invalid Email ID",
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id={`emails.${index}.email`}
                name={`emails.${index}.email`}
                type="text"
                value={value}
                onChange={(event) => {
                  emailOnChange(event);
                  onChange(event);
                }}
                ref={ref}
                hasError={Boolean(errors.emails?.[index]?.email)}
                placeholder={placeholderEmails[index % placeholderEmails.length]}
                className="h-12 w-full border-onboarding-border-100 text-xs placeholder:text-onboarding-text-400 sm:text-sm"
              />
            )}
          />
        </div>
        <div className="col-span-3 flex items-center rounded-md border border-onboarding-border-100 bg-onboarding-background-200">
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
                  setValue(`emails.${index}.role_active`, true);
                }}
                className="w-full flex-shrink-0 text-left"
              >
                <Listbox.Button
                  type="button"
                  ref={buttonRef}
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex h-11 w-full items-center justify-between gap-1 rounded-md px-2.5 py-2 text-xs duration-300"
                >
                  <span
                    className={`text-xs ${
                      !getValues(`emails.${index}.role_active`)
                        ? "text-onboarding-text-400"
                        : "text-onboarding-text-100"
                    } sm:text-sm`}
                  >
                    {ROLE[value]}
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 ${
                      !getValues(`emails.${index}.role_active`)
                        ? "stroke-onboarding-text-400"
                        : "stroke-onboarding-text-100"
                    }`}
                  />
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
                    className="fixed z-10 mt-1 max-h-48 w-36 overflow-y-auto rounded-md border border-onboarding-border-100 bg-onboarding-background-200 text-xs shadow-lg focus:outline-none"
                  >
                    <div className="space-y-1 p-2">
                      {Object.entries(ROLE).map(([key, value]) => (
                        <Listbox.Option
                          key={key}
                          value={parseInt(key)}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                              active || selected ? "bg-onboarding-background-400/40" : ""
                            } ${selected ? "text-onboarding-text-100" : "text-custom-text-200"}`
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
            className="ml-3 hidden place-items-center self-center rounded group-hover:grid"
            onClick={() => remove(index)}
          >
            <XCircle className="h-3.5 w-3.5 text-custom-text-400" />
          </button>
        )}
      </div>
      {email && !emailRegex.test(email) && (
        <div className="">
          <span className="text-sm">🤥</span>{" "}
          <span className="mt-1 text-xs text-red-500">That doesn{"'"}t look like an email address.</span>
        </div>
      )}
    </div>
  );
};

export const InviteMembers: React.FC<Props> = (props) => {
  const { finishOnboarding, stepChange, workspace } = props;

  const [isInvitationDisabled, setIsInvitationDisabled] = useState(true);

  const { setToastAlert } = useToast();
  const { resolvedTheme } = useTheme();

  const {
    control,
    watch,
    getValues,
    setValue,
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

    let payload = { ...formData };
    payload = { emails: payload.emails.filter((email) => email.email !== "") };

    await workspaceService
      .inviteWorkspace(workspace.slug, {
        emails: payload.emails.map((email) => ({
          email: email.email,
          role: email.role,
        })),
      })
      .then(async () => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });

        await nextStep();
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error,
        })
      );
  };

  const appendField = () => {
    append({ email: "", role: 15, role_active: false });
  };

  useEffect(() => {
    if (fields.length === 0) {
      append(
        [
          { email: "", role: 15, role_active: false },
          { email: "", role: 15, role_active: false },
          { email: "", role: 15, role_active: false },
        ],
        {
          focusIndex: 0,
        }
      );
    }
  }, [fields, append]);

  return (
    <div className="flex w-full py-14 ">
      <div
        className={`fixed ml-16 hidden h-fit w-1/5 rounded border-x border-t border-onboarding-border-300 border-opacity-10 bg-onboarding-gradient-300 p-4 pb-40 lg:block`}
      >
        <p className="text-base font-semibold text-onboarding-text-400">Members</p>

        {Array.from({ length: 4 }).map(() => (
          <div className="mt-6 flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
              <Image src={resolvedTheme === "dark" ? userDark : userLight} alt="user" className="object-cover" />
            </div>
            <div className="w-full">
              <div className="my-2 h-2.5 w-1/2 rounded-md  bg-onboarding-background-400" />
              <div className="h-2 w-1/3 rounded-md bg-onboarding-background-100" />
            </div>
          </div>
        ))}

        <div className="relative mt-20">
          <div className="absolute right-24 mt-1 flex w-full gap-x-2 rounded-full border border-onboarding-border-100 bg-onboarding-background-200 p-2 shadow-onboarding-shadow-sm">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-custom-primary-10">
              <Image src={user2} alt="user" />
            </div>
            <div>
              <p className="text-sm font-medium">Murphy cooper</p>
              <p className="text-sm text-onboarding-text-400">murphy@plane.so</p>
            </div>
          </div>

          <div className="absolute right-12 mt-16 flex w-full gap-x-2 rounded-full border border-onboarding-border-100 bg-onboarding-background-200 p-2 shadow-onboarding-shadow-sm">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-custom-primary-10">
              <Image src={user1} alt="user" />
            </div>
            <div>
              <p className="text-sm font-medium">Else Thompson</p>
              <p className="text-sm text-onboarding-text-400">Elsa@plane.so</p>
            </div>
          </div>
        </div>
      </div>
      <div className="ml-auto w-full lg:w-2/3 ">
        <form
          className="mx-auto ml-auto w-full space-y-7 px-7 sm:space-y-10 lg:w-5/6 lg:px-0"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.code === "Enter") e.preventDefault();
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold sm:text-2xl">Invite your team to work with you</h2>
            <OnboardingStepIndicator step={3} />
          </div>

          <div className="w-full text-sm xl:w-5/6">
            <div className="mb-3 space-y-3 sm:space-y-4">
              {fields.map((field, index) => (
                <InviteMemberForm
                  watch={watch}
                  getValues={getValues}
                  setValue={setValue}
                  isInvitationDisabled={isInvitationDisabled}
                  setIsInvitationDisabled={(value: boolean) => setIsInvitationDisabled(value)}
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
              className="flex items-center gap-2 bg-transparent py-2 pr-3 text-sm font-semibold text-custom-primary-100 outline-custom-primary-100"
              onClick={appendField}
            >
              <Plus className="h-3 w-3" />
              Add another
            </button>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              type="submit"
              disabled={isInvitationDisabled || !isValid}
              loading={isSubmitting}
              size="md"
            >
              {isSubmitting ? "Inviting..." : "Invite members"}
            </Button>
            {/* <Button variant="outline-primary" size="md" onClick={nextStep}>
            Copy invite link
          </Button> */}

            <span className="text-sm text-onboarding-text-400 hover:cursor-pointer" onClick={nextStep}>
              Do this later
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
