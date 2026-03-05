/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control, FieldArrayWithId, FormState } from "react-hook-form";
// plane imports
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import type { InvitationFormValues } from "@/hooks/use-workspace-invitation";
// local imports
import { InvitationFieldRow } from "./invitation-field-row";

type TInvitationFieldsProps = {
  workspaceSlug: string;
  fields: FieldArrayWithId<InvitationFormValues, "emails", "id">[];
  control: Control<InvitationFormValues>;
  formState: FormState<InvitationFormValues>;
  remove: (index: number) => void;
  className?: string;
};

export const InvitationFields = observer(function InvitationFields(props: TInvitationFieldsProps) {
  const {
    workspaceSlug,
    fields,
    control,
    formState: { errors },
    remove,
    className,
  } = props;
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  // derived values
  const currentWorkspaceRole = workspaceInfoBySlug(workspaceSlug.toString())?.role;

  return (
    <div className={cn("mb-3 space-y-4", className)}>
      {fields.map((field, index) => (
        <InvitationFieldRow
          key={field.id}
          index={index}
          workspaceSlug={workspaceSlug}
          control={control}
          errors={errors}
          remove={remove}
          showRemoveButton={fields.length > 1}
          currentWorkspaceRole={currentWorkspaceRole}
        />
      ))}
    </div>
  );
});
