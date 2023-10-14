import React, { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { useForm, Controller, useFieldArray } from "react-hook-form";

import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
import { Avatar, CustomSearchSelect, CustomSelect } from "components/ui";
//icons
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// services
import { ProjectService } from "services/project";
import { WorkspaceService } from "services/workspace.service";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// hooks
import useToast from "hooks/use-toast";
// types
import { IUser } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  members: any[];
  user: IUser | undefined;
  onSuccess: () => void;
};

type member = {
  role: 5 | 10 | 15 | 20;
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
const projectService = new ProjectService();
const workspaceService = new WorkspaceService();

const SendProjectInvitationModal: React.FC<Props> = (props) => {
  const { isOpen, setIsOpen, members, user, onSuccess } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();
  const { memberDetails } = useProjectMyMembership();

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

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

  const uninvitedPeople = people?.filter((person) => {
    const isInvited = members?.find((member) => member.memberId === person.member.id);

    return !isInvited;
  });

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;
    const payload = { ...formData };
    await projectService
      .inviteProject(workspaceSlug as string, projectId as string, payload, user)
      .then(() => {
        setIsOpen(false);
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Member added successfully",
        });
        onSuccess();
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        reset(defaultValues);
      });
  };

  const handleClose = () => {
    setIsOpen(false);
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
        <Avatar user={person.member} />
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-80 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Invite Members
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-custom-text-200">Invite members to work on your project.</p>
                    </div>

                    <div className="space-y-4 mb-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="group grid grid-cols-12 gap-x-4 mb-1 text-sm items-start">
                          <div className="flex flex-col gap-1 col-span-7">
                            <Controller
                              control={control}
                              name={`members.${index}.member_id`}
                              rules={{ required: "Please select a member" }}
                              render={({ field: { value, onChange } }) => (
                                <CustomSearchSelect
                                  value={value}
                                  customButton={
                                    <button className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 shadow-sm duration-300 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 focus:outline-none px-3 py-2 text-sm text-left">
                                      {value && value !== "" ? (
                                        <div className="flex items-center gap-2">
                                          <Avatar user={people?.find((p) => p.member.id === value)?.member} />
                                          {people?.find((p) => p.member.id === value)?.member.display_name}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 py-0.5">Select co-worker</div>
                                      )}
                                      <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                  }
                                  onChange={(val: string) => {
                                    onChange(val);
                                  }}
                                  options={options}
                                  width="w-full min-w-[12rem]"
                                />
                              )}
                            />
                            {errors.members && errors.members[index]?.member_id && (
                              <span className="text-sm px-1 text-red-500">
                                {errors.members[index]?.member_id?.message}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 col-span-5">
                            <div className="flex flex-col gap-1 w-full">
                              <Controller
                                name={`members.${index}.role`}
                                control={control}
                                rules={{ required: "Select Role" }}
                                render={({ field }) => (
                                  <CustomSelect
                                    {...field}
                                    customButton={
                                      <div className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 shadow-sm duration-300 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 focus:outline-none px-3 py-2.5 text-sm text-left">
                                        <span className="capitalize">
                                          {field.value ? ROLE[field.value] : "Select role"}
                                        </span>
                                        <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                                      </div>
                                    }
                                    input
                                    width="w-full"
                                  >
                                    {Object.entries(ROLE).map(([key, label]) => {
                                      if (parseInt(key) > (memberDetails?.role ?? 5)) return null;

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
                                <span className="text-sm px-1 text-red-500">
                                  {errors.members[index]?.role?.message}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-item w-6">
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  className="self-center place-items-center rounded"
                                  onClick={() => remove(index)}
                                >
                                  <XMarkIcon className="h-4 w-4 text-custom-text-200" />
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
                      className="flex items-center gap-2 outline-custom-primary bg-transparent text-custom-primary text-sm font-medium py-2 pr-3"
                      onClick={appendField}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add more
                    </button>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={isSubmitting}>
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
};

export default SendProjectInvitationModal;
