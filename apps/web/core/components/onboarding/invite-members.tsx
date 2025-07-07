"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
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
// icons
import { usePopper } from "react-popper";
import { Check, ChevronDown, Plus, XCircle } from "lucide-react";
import { Listbox } from "@headlessui/react";
// plane imports
import { ROLE, ROLE_DETAILS, EUserPermissions, MEMBER_TRACKER_EVENTS, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import { IUser, IWorkspace } from "@plane/types";
// ui
import { Button, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// helpers
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// services
import { WorkspaceService } from "@/plane-web/services";
// assets
import InviteMembersDark from "@/public/onboarding/invite-members-dark.webp";
import InviteMembersLight from "@/public/onboarding/invite-members-light.webp";
// components
import { OnboardingHeader } from "./header";
import { SwitchAccountDropdown } from "./switch-account-dropdown";

type Props = {
  finishOnboarding: () => Promise<void>;
  totalSteps: number;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
};

type EmailRole = {
  email: string;
  role: EUserPermissions;
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
const InviteMemberInput: React.FC<InviteMemberFormProps> = observer((props) => {
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

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { t } = useTranslation();

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

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  return (
    <div>
      <div className="group relative grid grid-cols-10 gap-4">
        <div className="col-span-6 ml-8">
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
                className="w-full border-onboarding-border-100 text-xs placeholder:text-onboarding-text-400 sm:text-sm"
                autoComplete="off"
              />
            )}
          />
        </div>
        <div className="col-span-4 mr-8">
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
                  setValue(`emails.${index}.role_active`, true);
                }}
                className="w-full flex-shrink-0 text-left"
              >
                <Listbox.Button
                  type="button"
                  ref={setReferenceElement}
                  className="flex w-full items-center justify-between gap-1 rounded-md px-2.5 py-2 text-sm border-[0.5px] border-onboarding-border-100"
                >
                  <span
                    className={`text-sm ${
                      !getValues(`emails.${index}.role_active`)
                        ? "text-onboarding-text-400"
                        : "text-onboarding-text-100"
                    } sm:text-sm`}
                  >
                    {ROLE[value]}
                  </span>

                  <ChevronDown
                    className={`size-3 ${
                      !getValues(`emails.${index}.role_active`)
                        ? "stroke-onboarding-text-400"
                        : "stroke-onboarding-text-100"
                    }`}
                  />
                </Listbox.Button>

                <Listbox.Options as="div">
                  <div
                    className="p-2 absolute space-y-1 z-10 mt-1 h-fit w-48 sm:w-60 rounded-md border border-onboarding-border-100 bg-onboarding-background-200 shadow-sm focus:outline-none"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    {Object.entries(ROLE_DETAILS).map(([key, value]) => (
                      <Listbox.Option
                        as="div"
                        key={key}
                        value={parseInt(key)}
                        className={({ active, selected }) =>
                          `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                            active || selected ? "bg-onboarding-background-400/40" : ""
                          } ${selected ? "text-onboarding-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center text-wrap gap-2 p-1">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium">{t(value.i18n_title)}</div>
                              <div className="flex text-xs text-custom-text-300">{t(value.i18n_description)}</div>
                            </div>
                            {selected && <Check className="h-4 w-4 shrink-0" />}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </div>
                </Listbox.Options>
              </Listbox>
            )}
          />
        </div>
        {fields.length > 1 && (
          <button
            type="button"
            className="absolute right-0 hidden place-items-center self-center rounded group-hover:grid"
            onClick={() => remove(index)}
          >
            <XCircle className="h-5 w-5 pl-0.5 text-custom-text-400" />
          </button>
        )}
      </div>
      {email && !emailRegex.test(email) && (
        <div className="mx-8 my-1">
          <span className="text-sm">🤥</span>{" "}
          <span className="mt-1 text-xs text-red-500">That doesn{"'"}t look like an email address.</span>
        </div>
      )}
    </div>
  );
});

export const InviteMembers: React.FC<Props> = (props) => {
  const { finishOnboarding, totalSteps, workspace } = props;

  const [isInvitationDisabled, setIsInvitationDisabled] = useState(true);

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
        captureSuccess({
          eventName: MEMBER_TRACKER_EVENTS.invite,
          payload: {
            workspace: workspace.slug,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Invitations sent successfully.",
        });

        await nextStep();
      })
      .catch((err) => {
        captureError({
          eventName: MEMBER_TRACKER_EVENTS.invite,
          payload: {
            workspace: workspace.slug,
          },
          error: err,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error,
        });
      });
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
    <div className="flex w-full h-full">
      <div className="w-full h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <div className="flex items-center justify-between">
          {/* Since this will always be the last step */}
          <OnboardingHeader currentStep={totalSteps} totalSteps={totalSteps} />
          <div className="shrink-0 lg:hidden">
            <SwitchAccountDropdown />
          </div>
        </div>
        <div className="flex flex-col w-full items-center justify-center p-8 mt-6 md:w-4/5 mx-auto">
          <div className="text-center space-y-1 py-4 mx-auto w-4/5">
            <h3 className="text-3xl font-bold text-onboarding-text-100">Invite your teammates</h3>
            <p className="font-medium text-onboarding-text-400">
              Work in plane happens best with your team. Invite them now to use Plane to its potential.
            </p>
          </div>
          <form
            className="w-full mx-auto mt-2 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.code === "Enter") e.preventDefault();
            }}
          >
            <div className="w-full text-sm py-4">
              <div className="group relative grid grid-cols-10 gap-4 mx-8 py-2">
                <div className="col-span-6 px-1 text-sm text-onboarding-text-200 font-medium">Email</div>
                <div className="col-span-4 px-1 text-sm text-onboarding-text-200 font-medium">Role</div>
              </div>
              <div className="mb-3 space-y-3 sm:space-y-4">
                {fields.map((field, index) => (
                  <InviteMemberInput
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
                className="flex items-center mx-8 gap-1.5 bg-transparent text-sm font-medium text-custom-primary-100 outline-custom-primary-100"
                onClick={appendField}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add another
              </button>
            </div>
            <div className="flex flex-col mx-auto px-8 sm:px-2 items-center justify-center gap-4 w-full max-w-96">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                className="w-full"
                disabled={isInvitationDisabled || !isValid || isSubmitting}
                data-ph-element={MEMBER_TRACKER_ELEMENTS.ONBOARDING_INVITE_MEMBER}
              >
                {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
              </Button>
              <Button variant="link-neutral" size="lg" className="w-full" onClick={nextStep}>
                I’ll do it later
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden lg:block relative w-2/5 h-screen overflow-hidden px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <SwitchAccountDropdown />
        <div className="absolute inset-0 z-0">
          <Image
            src={resolvedTheme === "dark" ? InviteMembersDark : InviteMembersLight}
            className="h-screen w-auto float-end object-cover"
            alt="Profile setup"
          />
        </div>
      </div>
    </div>
  );
};
