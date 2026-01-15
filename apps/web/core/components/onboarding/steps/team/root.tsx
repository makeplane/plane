import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import type {
  Control,
  FieldArrayWithId,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { usePopper } from "react-popper";
import { XCircle } from "lucide-react";
import { Listbox } from "@headlessui/react";
// plane imports
import type { EUserPermissions } from "@plane/constants";
import { ROLE, ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon, CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EOnboardingSteps } from "@plane/types";
import { Input, Spinner } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/plane-web/services";
// components
import { CommonOnboardingHeader } from "../common";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
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
const InviteMemberInput = observer(function InviteMemberInput(props: InviteMemberFormProps) {
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
        <div className="col-span-6">
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
                className="w-full border-strong text-11 placeholder:text-placeholder sm:text-13"
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
                  className="flex w-full items-center justify-between gap-1 rounded-md px-2.5 py-2 text-13 border-[0.5px] border-strong"
                >
                  <span
                    className={`text-13 ${
                      !getValues(`emails.${index}.role_active`) ? "text-placeholder" : "text-primary"
                    } sm:text-13`}
                  >
                    {ROLE[value]}
                  </span>

                  <ChevronDownIcon
                    className={`size-3 ${
                      !getValues(`emails.${index}.role_active`) ? "stroke-placeholder" : "stroke-primary"
                    }`}
                  />
                </Listbox.Button>

                <Listbox.Options as="div">
                  <div
                    className="p-2 absolute space-y-1 z-10 mt-1 h-fit w-48 sm:w-60 rounded-md border border-strong bg-surface-1 shadow-sm focus:outline-none"
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
                          `cursor-pointer select-none truncate rounded-sm px-1 py-1.5 ${
                            active || selected ? "bg-onboarding-background-400/40" : ""
                          } ${selected ? "text-primary" : "text-secondary"}`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center text-wrap gap-2 p-1">
                            <div className="flex flex-col">
                              <div className="text-13 font-medium">{t(value.i18n_title)}</div>
                              <div className="flex text-11 text-tertiary">{t(value.i18n_description)}</div>
                            </div>
                            {selected && <CheckIcon className="h-4 w-4 shrink-0" />}
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
            className="absolute right-0 hidden place-items-center self-center rounded-sm group-hover:grid"
            onClick={() => remove(index)}
          >
            <XCircle className="h-5 w-5 pl-0.5 text-placeholder" />
          </button>
        )}
      </div>
      {email && !emailRegex.test(email) && (
        <div className="mx-8 my-1">
          <span className="text-13">🤥</span>{" "}
          <span className="mt-1 text-11 text-danger-primary">That doesn{"'"}t look like an email address.</span>
        </div>
      )}
    </div>
  );
});

export const InviteTeamStep = observer(function InviteTeamStep(props: Props) {
  const { handleStepChange } = props;

  const [isInvitationDisabled, setIsInvitationDisabled] = useState(true);

  const { workspaces } = useWorkspace();
  const workspacesList = Object.values(workspaces ?? {});
  const workspace = workspacesList[0];

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
    await handleStepChange(EOnboardingSteps.INVITE_MEMBERS);
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
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Invitations sent successfully.",
        });
        await nextStep();
      })
      .catch((err) => {
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
    <form
      className="flex flex-col gap-10"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <CommonOnboardingHeader
        title="Invite your teammates"
        description="Work in plane happens best with your team. Invite them now to use Plane to its potential."
      />
      <div className="w-full text-13 py-4">
        <div className="group relative grid grid-cols-10 gap-4 mx-8 py-2">
          <div className="col-span-6 px-1 text-13 text-secondary font-medium">Email</div>
          <div className="col-span-4 px-1 text-13 text-secondary font-medium">Role</div>
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
          className="flex items-center mx-8 gap-1.5 bg-transparent text-13 font-medium text-accent-primary outline-accent-strong"
          onClick={appendField}
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2} />
          Add another
        </button>
      </div>
      <div className="flex flex-col mx-auto px-8 sm:px-2 items-center justify-center gap-4 w-full">
        <Button
          variant="primary"
          type="submit"
          size="xl"
          className="w-full"
          disabled={isInvitationDisabled || !isValid || isSubmitting}
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
        <Button variant="ghost" size="xl" className="w-full" onClick={nextStep}>
          I’ll do it later
        </Button>
      </div>
    </form>
  );
});
