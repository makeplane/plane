import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronDown, Plus, X } from "lucide-react";
// hooks
import { useApplication, useMember, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Avatar, Button, CustomSelect, CustomSearchSelect } from "@plane/ui";
// constants
import { ROLE } from "constants/workspace";
import { EUserProjectRoles } from "constants/project";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type member = {
  role: EUserProjectRoles;
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
  const { isOpen, onClose, onSuccess } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const {
    project: { projectMemberIds, bulkAddMembersToProject },
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  // form info
  const {
    formState: { errors, isSubmitting },
    reset,
    handleSubmit,
    control,
  } = useForm<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const uninvitedPeople = workspaceMemberIds?.filter((userId) => {
    const isInvited = projectMemberIds?.find((u) => u === userId);

    return !isInvited;
  });

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const payload = { ...formData };

    await bulkAddMembersToProject(workspaceSlug.toString(), projectId.toString(), payload)
      .then((res) => {
        if (onSuccess) onSuccess();
        onClose();
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Members added successfully.",
        });
        postHogEventTracker(
          "MEMBER_ADDED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      })
      .catch((error) => {
        console.error(error);
        postHogEventTracker(
          "MEMBER_ADDED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
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

  const options = uninvitedPeople?.map((userId) => {
    const memberDetails = getWorkspaceMemberDetails(userId);

    return {
      value: `${memberDetails?.member.id}`,
      query: `${memberDetails?.member.first_name} ${
        memberDetails?.member.last_name
      } ${memberDetails?.member.display_name.toLowerCase()}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={memberDetails?.member.display_name} src={memberDetails?.member.avatar} />
          {memberDetails?.member.display_name} (
          {memberDetails?.member.first_name + " " + memberDetails?.member.last_name})
        </div>
      ),
    };
  });

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
                      Invite Members
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-custom-text-200">Invite members to work on your project.</p>
                    </div>

                    <div className="mb-3 space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="group mb-1 grid grid-cols-12 items-start gap-x-4 text-sm">
                          <div className="col-span-7 flex flex-col gap-1">
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
                                              src={selectedMember?.member.avatar}
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
                                    }}
                                    options={options}
                                    optionsClassName="w-full"
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

                          <div className="col-span-5 flex items-center justify-between gap-2">
                            <div className="flex w-full flex-col gap-1">
                              <Controller
                                name={`members.${index}.role`}
                                control={control}
                                rules={{ required: "Select Role" }}
                                render={({ field }) => (
                                  <CustomSelect
                                    {...field}
                                    customButton={
                                      <div className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 px-3 py-2.5 text-left text-sm text-custom-text-200 shadow-sm duration-300 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
                                        <span className="capitalize">
                                          {field.value ? ROLE[field.value] : "Select role"}
                                        </span>
                                        <ChevronDown className="h-3 w-3" aria-hidden="true" />
                                      </div>
                                    }
                                    input
                                    optionsClassName="w-full"
                                  >
                                    {Object.entries(ROLE).map(([key, label]) => {
                                      if (parseInt(key) > (currentProjectRole ?? EUserProjectRoles.GUEST)) return null;

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
                            <div className="flex-item flex w-6">
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  className="place-items-center self-center rounded"
                                  onClick={() => remove(index)}
                                >
                                  <X className="h-4 w-4 text-custom-text-200" />
                                </button>
                              )}
                            </div>
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
                      Add more
                    </button>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                        {isSubmitting
                          ? `${fields && fields.length > 1 ? "Adding Members..." : "Adding Member..."}`
                          : `${fields && fields.length > 1 ? "Add Members" : "Add Member"}`}
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
