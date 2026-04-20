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

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon, CloseIcon, ChevronDownIcon, SuspendedUserIcon } from "@plane/propel/icons";
import { EPillSize, EPillVariant, Pill } from "@plane/propel/pill";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar } from "@plane/propel/avatar";
import { CustomSelect, CustomSearchSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn, getFileURL, isGuestRole, isWithinGuestCeiling, getAssignableProjectRoles } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
  workspaceSlug: string;
};

type member = {
  role_slug: string;
  member_id: string;
};

type FormValues = {
  members: member[];
};

const defaultValues: FormValues = {
  members: [
    {
      role_slug: "guest",
      member_id: "",
    },
  ],
};

export const SendProjectInvitationModal = observer(function SendProjectInvitationModal(props: Props) {
  const { isOpen, onClose, onSuccess, projectId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    project: { getProjectMemberDetails, bulkAddMembersToProject },
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails, isUserSuspended },
  } = useMember();
  const { getProjectRolesByWorkspaceSlug, getProjectRoleDetailsByRoleSlug } = useRoleManagement();
  const { getCurrentUserProjectRoleSlug } = usePermissionAccess();
  // form info
  const {
    formState: { errors, isSubmitting },
    watch,
    reset,
    handleSubmit,
    control,
    setValue,
  } = useForm<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });
  // derived values
  const assignableProjectRoles = getAssignableProjectRoles(
    getProjectRolesByWorkspaceSlug(workspaceSlug, "active"),
    getCurrentUserProjectRoleSlug(projectId)
  );
  const uninvitedPeople = workspaceMemberIds?.filter((userId) => {
    const projectMemberDetails = getProjectMemberDetails(userId, projectId);
    return !projectMemberDetails?.id;
  });

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const payload = { ...formData };

    await bulkAddMembersToProject(workspaceSlug.toString(), projectId.toString(), payload)
      .then(() => {
        if (onSuccess) onSuccess();
        onClose();
        setToast({
          title: "Success!",
          type: TOAST_TYPE.SUCCESS,
          message: "Members added successfully.",
        });
        return;
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        reset(defaultValues);
      });
  };

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const appendField = () => {
    append({
      role_slug: "guest",
      member_id: "",
    });
  };

  useEffect(() => {
    if (fields.length === 0) {
      append([
        {
          role_slug: "guest",
          member_id: "",
        },
      ]);
    }
  }, [fields, append]);

  const options = (uninvitedPeople ?? [])
    ?.map((userId) => {
      const memberDetails = getWorkspaceMemberDetails(userId);

      if (!memberDetails?.member) return;
      const isSuspended = isUserSuspended(userId, workspaceSlug?.toString());
      return {
        value: `${memberDetails?.member.id}`,
        query: `${memberDetails?.member.first_name} ${
          memberDetails?.member.last_name
        } ${memberDetails?.member.display_name.toLowerCase()}`,
        disabled: isSuspended,
        content: (
          <div className="flex w-full items-center gap-2">
            <div className="shrink-0 pt-0.5">
              {isSuspended ? (
                <SuspendedUserIcon className="h-3.5 w-3.5 text-placeholder" />
              ) : (
                <Avatar name={memberDetails?.member.display_name} src={getFileURL(memberDetails?.member.avatar_url)} />
              )}
            </div>
            <span className={cn("truncate", isSuspended && "text-placeholder")}>
              {memberDetails?.member.display_name} (
              {memberDetails?.member.first_name + " " + memberDetails?.member.last_name})
            </span>
            {isSuspended && (
              <Pill variant={EPillVariant.DEFAULT} size={EPillSize.XS} className="border-none">
                Suspended
              </Pill>
            )}
          </div>
        ),
      };
    })
    .filter((option): option is NonNullable<typeof option> => !!option);

  const getAllowedRolesForMember = (memberId: string) => {
    if (!memberId) return assignableProjectRoles;
    const wsRoleSlug = getWorkspaceMemberDetails(memberId)?.role_slug;
    if (isGuestRole(wsRoleSlug)) {
      return assignableProjectRoles.filter((r) => isWithinGuestCeiling(r.slug));
    }
    return assignableProjectRoles;
  };

  const handleMemberChange = (index: number, memberId: string, onChange: (val: string) => void) => {
    onChange(memberId);
    // Reset role if it's not allowed for the selected member's workspace role
    const currentRoleSlug = watch(`members.${index}.role_slug`);
    const allowedRoles = getAllowedRolesForMember(memberId);
    if (!allowedRoles.some((r) => r.slug === currentRoleSlug)) {
      setValue(`members.${index}.role_slug`, allowedRoles[0]?.slug ?? "guest");
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5">
        <div className="space-y-5">
          <h3 className="text-16 font-medium leading-6 text-primary">
            {t("project_settings.members.invite_members.title")}
          </h3>
          <div className="mt-2">
            <p className="text-13 text-secondary">{t("project_settings.members.invite_members.sub_heading")}</p>
          </div>

          <div className="mb-3 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="group mb-1 flex items-start justify-between gap-x-2 text-13 w-full">
                <div className="flex flex-col gap-1 grow w-full">
                  <Controller
                    control={control}
                    name={`members.${index}.member_id`}
                    rules={{ required: "Please select a member" }}
                    render={({ field: { value, onChange } }) => {
                      const selectedMember = getWorkspaceMemberDetails(value);
                      return (
                        <CustomSearchSelect
                          value={value}
                          customButton={
                            <button className="flex w-full items-center justify-between gap-1 rounded-md border border-subtle px-3 py-2 text-left text-13 text-secondary shadow-sm duration-300 hover:bg-layer-1 hover:text-primary focus:outline-none">
                              {value && value !== "" ? (
                                <div className="flex items-center gap-2 py-0.5">
                                  <Avatar
                                    name={selectedMember?.member.display_name}
                                    src={getFileURL(selectedMember?.member.avatar_url ?? "")}
                                  />
                                  {selectedMember?.member.display_name}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 py-0.5">Select co-worker</div>
                              )}
                              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                            </button>
                          }
                          onChange={(val: string) => {
                            handleMemberChange(index, val, onChange);
                          }}
                          options={options}
                          optionsClassName="w-48"
                        />
                      );
                    }}
                  />
                  {errors.members && errors.members[index]?.member_id && (
                    <span className="px-1 text-13 text-danger-primary">
                      {errors.members[index]?.member_id?.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 shrink-0">
                  <div className="flex flex-col gap-1">
                    <Controller
                      name={`members.${index}.role_slug`}
                      control={control}
                      rules={{ required: "Select Role" }}
                      render={({ field: { value, onChange } }) => (
                        <CustomSelect
                          value={value}
                          onChange={onChange}
                          customButton={
                            <div className="flex w-32 items-center justify-between gap-1 rounded-md border border-subtle px-3 py-2.5 text-left text-13 text-secondary shadow-sm duration-300 hover:bg-layer-1 hover:text-primary focus:outline-none">
                              <span className="capitalize">
                                {getProjectRoleDetailsByRoleSlug(workspaceSlug, value)?.name ?? "Select role"}
                              </span>
                              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                            </div>
                          }
                          input
                        >
                          {getAllowedRolesForMember(watch(`members.${index}.member_id`)).map((role) => (
                            <CustomSelect.Option key={role.slug} value={role.slug}>
                              {role.name}
                            </CustomSelect.Option>
                          ))}
                        </CustomSelect>
                      )}
                    />
                    {errors.members && errors.members[index]?.role_slug && (
                      <span className="px-1 text-13 text-danger-primary">
                        {errors.members[index]?.role_slug?.message}
                      </span>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <div className="flex-item flex w-6">
                      <button
                        type="button"
                        className="place-items-center self-center rounded-sm"
                        onClick={() => remove(index)}
                      >
                        <CloseIcon className="h-4 w-4 text-secondary" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 bg-transparent py-2 pr-3 text-13 font-medium text-accent-primary outline-accent-strong"
            onClick={appendField}
          >
            <PlusIcon className="h-4 w-4" />
            {t("common.add_more")}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="lg" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
              {isSubmitting
                ? `${fields && fields.length > 1 ? `${t("add_members")}...` : `${t("add_member")}...`}`
                : `${fields && fields.length > 1 ? t("add_members") : t("add_member")}`}
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
});
