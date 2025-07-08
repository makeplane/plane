"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { ChevronDown, Plus, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { ROLE, EUserPermissions, MEMBER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Avatar, Button, CustomSelect, CustomSearchSelect, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember, useUserPermissions } from "@/hooks/store";

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

const defaultValues: FormValues = {
  members: [
    {
      role: 5,
      member_id: "",
    },
  ],
};

export const SendProjectInvitationModal: React.FC<Props> = observer((props) => {
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
  const uninvitedPeople = workspaceMemberIds?.filter((userId) => {
    const projectMemberDetails = getProjectMemberDetails(userId, projectId);
    const isInvited = projectMemberDetails?.member.id && projectMemberDetails?.original_role;
    return !isInvited;
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

        captureSuccess({
          eventName: MEMBER_TRACKER_EVENTS.project.add,
          payload: {
            members: [...payload.members.map((member) => member.member_id)],
          },
        });
      })
      .catch((error) => {
        console.error(error);
        captureError({
          eventName: MEMBER_TRACKER_EVENTS.project.add,
          payload: {
            members: [...payload.members.map((member) => member.member_id)],
          },
          error: error,
        });
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

  const options = uninvitedPeople
    ?.map((userId) => {
      const memberDetails = getWorkspaceMemberDetails(userId);

      if (!memberDetails?.member) return;
      return {
        value: `${memberDetails?.member.id}`,
        query: `${memberDetails?.member.first_name} ${
          memberDetails?.member.last_name
        } ${memberDetails?.member.display_name.toLowerCase()}`,
        content: (
          <div className="flex w-full items-center gap-2">
            <div className="flex-shrink-0 pt-0.5">
              <Avatar name={memberDetails?.member.display_name} src={getFileURL(memberDetails?.member.avatar_url)} />
            </div>
            <div className="truncate">
              {memberDetails?.member.display_name} (
              {memberDetails?.member.first_name + " " + memberDetails?.member.last_name})
            </div>
          </div>
        ),
      };
    })
    .filter((option) => !!option) as
    | {
        value: string;
        query: string;
        content: React.JSX.Element;
      }[]
    | undefined;

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

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      {t("project_settings.members.invite_members.title")}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-custom-text-200">
                        {t("project_settings.members.invite_members.sub_heading")}
                      </p>
                    </div>

                    <div className="mb-3 space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="group mb-1 flex items-start justify-between gap-x-4 text-sm w-full"
                        >
                          <div className="flex flex-col gap-1 flex-grow w-full">
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
                                      <button className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 px-3 py-2 text-left text-sm text-custom-text-200 shadow-sm duration-300 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
                                        {value && value !== "" ? (
                                          <div className="flex items-center gap-2">
                                            <Avatar
                                              name={selectedMember?.member.display_name}
                                              src={getFileURL(selectedMember?.member.avatar_url ?? "")}
                                            />
                                            {selectedMember?.member.display_name}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 py-0.5">Select co-worker</div>
                                        )}
                                        <ChevronDown className="h-3 w-3" aria-hidden="true" />
                                      </button>
                                    }
                                    onChange={(val: string) => {
                                      onChange(val);
                                      // Update the role to the workspace role when member ID changes
                                      const workspaceMemberDetails = getWorkspaceMemberDetails(val);
                                      const workspaceRole = workspaceMemberDetails?.role ?? 5;
                                      const newValue = ROLE[workspaceRole].toUpperCase();
                                      setValue(
                                        `members.${index}.role`,
                                        EUserPermissions[newValue as keyof typeof EUserPermissions]
                                      );
                                    }}
                                    options={options}
                                    optionsClassName="w-48"
                                  />
                                );
                              }}
                            />
                            {errors.members && errors.members[index]?.member_id && (
                              <span className="px-1 text-sm text-red-500">
                                {errors.members[index]?.member_id?.message}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 flex-shrink-0 ">
                            <div className="flex flex-col gap-1">
                              <Controller
                                name={`members.${index}.role`}
                                control={control}
                                rules={{ required: "Select Role" }}
                                render={({ field }) => (
                                  <CustomSelect
                                    {...field}
                                    customButton={
                                      <div className="flex w-24 items-center justify-between gap-1 rounded-md border border-custom-border-200 px-3 py-2.5 text-left text-sm text-custom-text-200 shadow-sm duration-300 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
                                        <span className="capitalize">
                                          {field.value ? ROLE[field.value] : "Select role"}
                                        </span>
                                        <ChevronDown className="h-3 w-3" aria-hidden="true" />
                                      </div>
                                    }
                                    input
                                    optionsClassName="w-full"
                                  >
                                    {Object.entries(
                                      checkCurrentOptionWorkspaceRole(watch(`members.${index}.member_id`))
                                    ).map(([key, label]) => {
                                      if (parseInt(key) > (currentProjectRole ?? EUserPermissions.GUEST)) return null;

                                      return (
                                        <CustomSelect.Option key={key} value={key}>
                                          {label}
                                        </CustomSelect.Option>
                                      );
                                    })}
                                  </CustomSelect>
                                )}
                              />
                              {errors.members && errors.members[index]?.role && (
                                <span className="px-1 text-sm text-red-500">
                                  {errors.members[index]?.role?.message}
                                </span>
                              )}
                            </div>

                            {fields.length > 1 && (
                              <div className="flex-item flex w-6">
                                <button
                                  type="button"
                                  className="place-items-center self-center rounded"
                                  onClick={() => remove(index)}
                                >
                                  <X className="h-4 w-4 text-custom-text-200" />
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
                      className="flex items-center gap-2 bg-transparent py-2 pr-3 text-sm font-medium text-custom-primary outline-custom-primary"
                      onClick={appendField}
                    >
                      <Plus className="h-4 w-4" />
                      {t("common.add_more")}
                    </button>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                        {t("cancel")}
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                        {isSubmitting
                          ? `${fields && fields.length > 1 ? `${t("add_members")}...` : `${t("add_member")}...`}`
                          : `${fields && fields.length > 1 ? t("add_members") : t("add_member")}`}
                      </Button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
