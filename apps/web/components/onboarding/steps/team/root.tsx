/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
import { AddOutline, CloseCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import type { EUserPermissions } from "@plane/constants";
import { ROLE, ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { setToast } from "@plane/blocks/toast";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { Spinner } from "@plane/blocks/spinner";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";
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

type TRoleOption = { key: EUserPermissions; i18n_title: string; i18n_description: string };

// services
const workspaceService = new WorkspaceService();
const roleOptions: TRoleOption[] = Object.entries(ROLE_DETAILS).map(([key, details]) => ({
  key: parseInt(key) as EUserPermissions,
  i18n_title: details.i18n_title,
  i18n_description: details.i18n_description,
}));
// legacy role picker opened at bottom-end (right-column trigger), so align the panel to its end edge
const ROLE_SELECT_PLACEMENT = { side: "bottom", align: "end" } as const;
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
                message: t("web_ui.invalid_email_id"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Field name="input" invalid={Boolean(errors.emails?.[index]?.email)}>
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id={`emails.${index}.email`}
                    name={`emails.${index}.email`}
                    type="text"
                    value={value}
                    onChange={(event) => {
                      emailOnChange(event);
                      onChange(event);
                    }}
                    ref={ref}
                    placeholder={placeholderEmails[index % placeholderEmails.length]}
                    autoComplete="off"
                  />
                </InputGroup>
              </Field>
            )}
          />
        </div>
        <div className="col-span-4 mr-8">
          <Controller
            control={control}
            name={`emails.${index}.role`}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <SelectDropdownPlacementContext.Provider value={ROLE_SELECT_PLACEMENT}>
                <Select<TRoleOption>
                  value={roleOptions.find((role) => role.key === value) ?? null}
                  onChange={(val) => {
                    onChange(Number(val) as EUserPermissions);
                    setValue(`emails.${index}.role_active`, true);
                  }}
                  getValues={() => roleOptions}
                  getOptionValue={(role) => String(role.key)}
                  getOptionLabel={(role) => t(role.i18n_title)}
                  getOptionDescription={(role) => t(role.i18n_description)}
                  showSearch={false}
                  pinSelected={false}
                >
                  <Select.Trigger<TRoleOption> variant="select-2xl">
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-13",
                        getValues(`emails.${index}.role_active`) ? "text-primary" : "text-placeholder"
                      )}
                    >
                      {ROLE[value]}
                    </span>
                  </Select.Trigger>
                </Select>
              </SelectDropdownPlacementContext.Provider>
            )}
          />
        </div>
        {fields.length > 1 && (
          <button
            type="button"
            className="absolute right-0 hidden place-items-center self-center rounded-sm group-hover:grid"
            onClick={() => remove(index)}
          >
            <CloseCircleOutline className="h-5 w-5 pl-0.5 text-placeholder" />
          </button>
        )}
      </div>
      {email && !emailRegex.test(email) && (
        <div className="mx-8 my-1">
          <span className="text-13">🤥</span>{" "}
          <span className="mt-1 text-11 text-danger-primary">{t("web_ui.invalid_email_hint")}</span>
        </div>
      )}
    </div>
  );
});

export const InviteTeamStep = observer(function InviteTeamStep(props: Props) {
  const { t } = useTranslation();

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
          type: "success",
          title: t("success"),
          message: t("workspace_settings.settings.members.invitations_sent_successfully"),
        });
        await nextStep();

        return undefined;
      })
      .catch((err) => {
        setToast({
          type: "error",
          title: t("error"),
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
        title={t("web_ui.invite_your_teammates")}
        description={t(
          "web_ui.work_in_plane_happens_best_with_your_team_invite_them_now_to_use_plane_to_its_potential"
        )}
      />
      <div className="w-full py-4 text-13">
        <div className="group relative mx-8 grid grid-cols-10 gap-4 py-2">
          <div className="col-span-6 px-1 text-13 font-medium text-secondary">{t("email")}</div>
          <div className="col-span-4 px-1 text-13 font-medium text-secondary">{t("role")}</div>
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
          className="mx-8 flex items-center gap-1.5 bg-transparent text-13 font-medium text-accent-primary outline-accent-strong"
          onClick={appendField}
        >
          <AddOutline className="h-4 w-4" />
          {t("web_ui.add_another")}{" "}
        </button>
      </div>
      <div className="mx-auto flex w-full flex-col items-center justify-center gap-4 px-8 sm:px-2">
        <ButtonElement
          variant="primary"
          type="submit"
          size="lg"
          stretch="full"
          disabled={isInvitationDisabled || !isValid || isSubmitting}
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
        </ButtonElement>
        <Button variant="ghost" size="lg" stretch="full" onClick={nextStep} label={t("web_ui.i_ll_do_it_later")} />
      </div>
    </form>
  );
});
