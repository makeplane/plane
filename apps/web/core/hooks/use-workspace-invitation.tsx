/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect } from "react";
import type { Control, FieldArrayWithId, FormState, UseFormWatch } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";

type EmailRole = {
  email: string;
  role_slug: string;
};

export type InvitationFormValues = {
  emails: EmailRole[];
};

const SEND_WORKSPACE_INVITATION_MODAL_DEFAULT_VALUES: InvitationFormValues = {
  emails: [
    {
      email: "",
      role_slug: "",
    },
  ],
};

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
  // form info
  const { control, reset, watch, handleSubmit, formState } = useForm<InvitationFormValues>({
    defaultValues: SEND_WORKSPACE_INVITATION_MODAL_DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emails",
  });

  const handleClose = () => {
    onClose();
    const timeout = setTimeout(() => {
      reset(SEND_WORKSPACE_INVITATION_MODAL_DEFAULT_VALUES);
      clearTimeout(timeout);
    }, 350);
  };

  const appendField = () => {
    append({ email: "", role_slug: "" });
  };

  const onSubmitForm = async (data: InvitationFormValues) => {
    await onSubmit(data)?.then(() => {
      reset(SEND_WORKSPACE_INVITATION_MODAL_DEFAULT_VALUES);
      return true;
    });
  };

  useEffect(() => {
    if (fields.length === 0) append([{ email: "", role_slug: "" }]);
  }, [fields, append]);

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
