/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
// plane imports
import { ROLE, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { AddOutline, ChevronDownOutline, CloseOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { Select } from "@plane/blocks/select";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
  workspaceSlug: string;
};

type member = {
  role: EUserPermissions;
  member_id: string;
};

type FormValues = {
  members: member[];
};

type TRoleOption = {
  key: EUserPermissions;
  label: string;
};

const defaultValues: FormValues = {
  members: [
    {
      role: 5,
      member_id: "",
    },
  ],
};

export const SendProjectInvitationModal = observer(function SendProjectInvitationModal(props: Props) {
  const { isOpen, onClose, onSuccess, projectId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const {
    project: { getProjectMemberDetails, bulkAddMembersToProject },
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  // form info
  const {
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    handleSubmit,
    control,
  } = useForm<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });
  // derived values
  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const uninvitedPeople =
    workspaceMemberIds?.filter((userId) => {
      if (!getWorkspaceMemberDetails(userId)?.member) return false;
      const projectMemberDetails = getProjectMemberDetails(userId, projectId);
      const isInvited = projectMemberDetails?.member.id && projectMemberDetails?.original_role;
      return !isInvited;
    }) ?? [];

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const payload = { ...formData };

    await bulkAddMembersToProject(workspaceSlug.toString(), projectId.toString(), payload)
      .then(() => {
        if (onSuccess) onSuccess();
        onClose();
        setToast({
          title: "Success!",
          type: "success",
          message: "Members added successfully.",
        });
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
      role: 5,
      member_id: "",
    });
  };

  useEffect(() => {
    if (fields.length === 0) {
      append([
        {
          role: 5,
          member_id: "",
        },
      ]);
    }
  }, [fields, append]);

  const checkCurrentOptionWorkspaceRole = (value: string) => {
    const currentMemberWorkspaceRole = getWorkspaceMemberDetails(value)?.role;
    if (!value || !currentMemberWorkspaceRole) return ROLE;

    const isGuestOROwner = [EUserPermissions.ADMIN, EUserPermissions.GUEST].includes(
      currentMemberWorkspaceRole as EUserPermissions
    );

    return Object.fromEntries(
      Object.entries(ROLE).filter(([key]) => !isGuestOROwner || [currentMemberWorkspaceRole].includes(parseInt(key)))
    );
  };

  const getRoleOptions = (memberId: string): TRoleOption[] =>
    Object.entries(checkCurrentOptionWorkspaceRole(memberId))
      .filter(([key]) => parseInt(key) <= (currentProjectRole ?? EUserPermissions.GUEST))
      .map(([key, label]) => ({ key: parseInt(key) as EUserPermissions, label }));

  const handleMemberChange = (index: number, memberId: string, onChange: (val: string) => void) => {
    onChange(memberId);
    // Update the role to the workspace role when member ID changes
    const workspaceMemberDetails = getWorkspaceMemberDetails(memberId);
    const workspaceRole = workspaceMemberDetails?.role ?? 5;
    const newValue = ROLE[workspaceRole].toUpperCase();
    setValue(`members.${index}.role`, EUserPermissions[newValue as keyof typeof EUserPermissions]);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{t("project_settings.members.invite_members.title")}</DialogTitle>
                <DialogDescription>{t("project_settings.members.invite_members.sub_heading")}</DialogDescription>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="group mb-1 flex w-full items-start justify-between gap-x-4 text-13">
                    <div className="flex w-full grow flex-col gap-1">
                      <Controller
                        control={control}
                        name={`members.${index}.member_id`}
                        rules={{ required: "Please select a member" }}
                        render={({ field: { value, onChange } }) => (
                          <MemberSelect
                            value={value || null}
                            onChange={(val: string) => handleMemberChange(index, val, onChange)}
                            variant="select-lg"
                            memberIds={uninvitedPeople}
                            placeholder="Select co-worker"
                          />
                        )}
                      />
                      {errors.members && errors.members[index]?.member_id && (
                        <span className="px-1 text-13 text-danger-primary">
                          {errors.members[index]?.member_id?.message}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <Controller
                          name={`members.${index}.role`}
                          control={control}
                          rules={{ required: "Select Role" }}
                          render={({ field: { value, onChange } }) => {
                            const roleOptions = getRoleOptions(watch(`members.${index}.member_id`));
                            return (
                              <div className="w-32">
                                <Select<TRoleOption>
                                  getValues={() => roleOptions}
                                  value={roleOptions.find((role) => role.key === value) ?? null}
                                  onChange={(key) => onChange(parseInt(key))}
                                  getOptionValue={(role) => String(role.key)}
                                  getOptionLabel={(role) => role.label}
                                  placeholder="Select role"
                                  showSearch={false}
                                  pinSelected={false}
                                >
                                  <Select.Trigger<TRoleOption>
                                    variant="pill-md"
                                    appendIcon={<ChevronDownOutline />}
                                    tooltip={{ emptyContent: "Select role" }}
                                  >
                                    <span className="min-w-0 grow truncate text-left capitalize">
                                      {value ? ROLE[value] : "Select role"}
                                    </span>
                                  </Select.Trigger>
                                </Select>
                              </div>
                            );
                          }}
                        />
                        {errors.members && errors.members[index]?.role && (
                          <span className="px-1 text-13 text-danger-primary">
                            {errors.members[index]?.role?.message}
                          </span>
                        )}
                      </div>

                      {fields.length > 1 && (
                        <div className="flex-item flex w-6">
                          <button
                            type="button"
                            aria-label={t("remove")}
                            className="place-items-center self-center rounded-sm"
                            onClick={() => remove(index)}
                          >
                            <CloseOutline className="h-4 w-4 text-secondary" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                className="flex items-center gap-2 bg-transparent py-2 pr-3 text-13 font-medium text-accent-primary outline-accent-strong"
                onClick={appendField}
              >
                <AddOutline className="h-4 w-4" />
                {t("common.add_more")}
              </button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
                <Button
                  variant="primary"
                  size="md"
                  stretch="auto"
                  type="submit"
                  label={
                    isSubmitting
                      ? `${fields && fields.length > 1 ? `${t("add_members")}...` : `${t("add_member")}...`}`
                      : `${fields && fields.length > 1 ? t("add_members") : t("add_member")}`
                  }
                  loading={isSubmitting}
                />
              </div>
            </div>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
});
