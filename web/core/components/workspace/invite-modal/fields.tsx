"use client";

import { observer } from "mobx-react";
import { Control, Controller, FieldArrayWithId, FormState } from "react-hook-form";
import { X } from "lucide-react";
// plane imports
import { ROLE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomSelect, Input } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { InvitationFormValues } from "@/hooks/use-workspace-invitation";

type TInvitationFieldsProps = {
  workspaceSlug: string;
  fields: FieldArrayWithId<InvitationFormValues, "emails", "id">[];
  control: Control<InvitationFormValues>;
  formState: FormState<InvitationFormValues>;
  remove: (index: number) => void;
  className?: string;
};

export const InvitationFields = observer((props: TInvitationFieldsProps) => {
  const {
    workspaceSlug,
    fields,
    control,
    formState: { errors },
    remove,
    className,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  // derived values
  const currentWorkspaceRole = workspaceInfoBySlug(workspaceSlug.toString())?.role;

  return (
    <div className={cn("mb-3 space-y-4", className)}>
      {fields.map((field, index) => (
        <div key={field.id} className="relative group mb-1 flex items-start justify-between gap-x-4 text-sm w-full">
          <div className="w-full">
            <Controller
              control={control}
              name={`emails.${index}.email`}
              rules={{
                required: t("workspace_settings.settings.members.modal.errors.required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("workspace_settings.settings.members.modal.errors.invalid"),
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <>
                  <Input
                    id={`emails.${index}.email`}
                    name={`emails.${index}.email`}
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.emails?.[index]?.email)}
                    placeholder={t("workspace_settings.settings.members.modal.placeholder")}
                    className="w-full text-xs sm:text-sm"
                  />
                  {errors.emails?.[index]?.email && (
                    <span className="ml-1 text-xs text-red-500">{errors.emails?.[index]?.email?.message}</span>
                  )}
                </>
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2 flex-shrink-0 ">
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name={`emails.${index}.role`}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    label={<span className="text-xs sm:text-sm">{ROLE[value]}</span>}
                    onChange={onChange}
                    optionsClassName="w-full"
                    className="flex-grow w-24"
                    input
                  >
                    {Object.entries(ROLE).map(([key, value]) => {
                      if (currentWorkspaceRole && currentWorkspaceRole >= parseInt(key))
                        return (
                          <CustomSelect.Option key={key} value={parseInt(key)}>
                            {value}
                          </CustomSelect.Option>
                        );
                    })}
                  </CustomSelect>
                )}
              />
            </div>
            {fields.length > 1 && (
              <div className="flex-item flex w-6">
                <button type="button" className="place-items-center self-center rounded" onClick={() => remove(index)}>
                  <X className="h-4 w-4 text-custom-text-200" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
