import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronDown, Plus, X } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Avatar, Button, CustomSelect, CustomSearchSelect } from "@plane/ui";
// services
import { ProjectMemberService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
// types
import { IProjectMember, TUserProjectRole } from "types";
// constants
import { EUserWorkspaceRoles, ROLE } from "constants/workspace";

type Props = {
  isOpen: boolean;
  members: IProjectMember[];
  onClose: () => void;
  onSuccess: () => void;
};

type member = {
  role: TUserProjectRole;
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

// services
const projectMemberService = new ProjectMemberService();

export const SendProjectInvitationModal: React.FC<Props> = observer((props) => {
  const { isOpen, members, onClose, onSuccess } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const {
    user: { currentProjectRole },
    workspaceMember: { workspaceMembers },
    trackEvent: { postHogEventTracker },
    workspace: { currentWorkspace },
  } = useMobxStore();

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

  const uninvitedPeople = workspaceMembers?.filter((person) => {
    const isInvited = members?.find((member) => member.member.id === person.member.id);

    return !isInvited;
  });

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const payload = { ...formData };

    await projectMemberService
      .bulkAddMembersToProject(workspaceSlug.toString(), projectId.toString(), payload)
      .then((res) => {
        onSuccess();
        onClose();
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Member added successfully",
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
            gorupId: currentWorkspace?.id!,
          }
        );
      })
      .catch((error) => {
        console.log(error);
        postHogEventTracker(
          "MEMBER_ADDED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
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

  const options = uninvitedPeople?.map((person) => ({
    value: person.member.id,
    query: person.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar name={person.member?.display_name} src={person.member?.avatar} />
        {person.member.display_name} ({person.member.first_name + " " + person.member.last_name})
      </div>
    ),
  }));

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
                                const selectedMember = workspaceMembers?.find((p) => p.member.id === value)?.member;

                                return (
                                  <CustomSearchSelect
                                    value={value}
                                    customButton={
                                      <button className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 px-3 py-2 text-left text-sm text-custom-text-200 shadow-sm duration-300 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
                                        {value && value !== "" ? (
                                          <div className="flex items-center gap-2">
                                            <Avatar name={selectedMember?.display_name} src={selectedMember?.avatar} />
                                            {selectedMember?.display_name}
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
                                    width="w-full min-w-[12rem]"
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
                                    width="w-full"
                                  >
                                    {Object.entries(ROLE).map(([key, label]) => {
                                      if (parseInt(key) > (currentProjectRole ?? EUserWorkspaceRoles.GUEST))
                                        return null;

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
