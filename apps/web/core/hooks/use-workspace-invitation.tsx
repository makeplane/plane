/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import type { Control, FieldArrayWithId, FormState, UseFormWatch } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type EmailRole = {
  email: string;
  role: EUserPermissions;
  language: string;
};

export type InvitationFormValues = {
  emails: EmailRole[];
};

const emptyInvitationRow = (language: string): EmailRole => ({
  email: "",
  role: EUserPermissions.MEMBER,
  language,
});

type TUseWorkspaceInvitationProps = {
  onSubmit: (data: InvitationFormValues) => Promise<void> | undefined;
  onClose: () => void;
};

type TUseWorkspaceInvitationReturn = {
  control: Control<InvitationFormValues>;
  fields: FieldArrayWithId<InvitationFormValues, "emails", "id">[];
  formState: FormState<InvitationFormValues>;
  watch: UseFormWatch<InvitationFormValues>;
  remove: (index: number) => void;
  onFormSubmit: () => void;
  handleClose: () => void;
  appendField: () => void;
};

export const useWorkspaceInvitationActions = (props: TUseWorkspaceInvitationProps): TUseWorkspaceInvitationReturn => {
  const { onSubmit, onClose } = props;
  // plane hooks
  const { currentLocale } = useTranslation();
  // form info
  const { control, reset, watch, handleSubmit, formState } = useForm<InvitationFormValues>({
    defaultValues: { emails: [emptyInvitationRow(currentLocale)] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emails",
  });

  const handleClose = () => {
    onClose();
    const timeout = setTimeout(() => {
      reset({ emails: [emptyInvitationRow(currentLocale)] });
      clearTimeout(timeout);
    }, 350);
  };

  const appendField = () => {
    append(emptyInvitationRow(currentLocale));
  };

  const onSubmitForm = async (data: InvitationFormValues) => {
    await onSubmit(data)?.then(() => {
      reset({ emails: [emptyInvitationRow(currentLocale)] });
    });
  };

  useEffect(() => {
    if (fields.length === 0) append(emptyInvitationRow(currentLocale));
  }, [fields, append, currentLocale]);

  return {
    control,
    fields,
    formState,
    watch,
    remove,
    onFormSubmit: handleSubmit(onSubmitForm),
    handleClose,
    appendField,
  };
};
