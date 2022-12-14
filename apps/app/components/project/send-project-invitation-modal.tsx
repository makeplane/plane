import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { useForm, Controller } from "react-hook-form";

import { Dialog, Transition, Listbox } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// services
import projectService from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// constants
import { ROLE } from "constants/";
import { PROJECT_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// ui
import { Button, Select, TextArea } from "ui";
// icons
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/20/solid";

// types
import { IProjectMemberInvitation } from "types";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  members: any[];
};

type ProjectMember = IProjectMemberInvitation & {
  member_id: string;
  user_id: string;
};

const defaultValues: Partial<ProjectMember> = {
  email: "",
  message: "",
  role: 5,
  member_id: "",
  user_id: "",
};

const SendProjectInvitationModal: React.FC<Props> = ({ isOpen, setIsOpen, members }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403 || err?.status === 401) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    control,
  } = useForm<ProjectMember>({
    defaultValues,
  });

  const uninvitedPeople = people?.filter((person) => {
    const isInvited = members?.find((member) => member.email === person.member.email);
    return !isInvited;
  });

  const onSubmit = async (formData: ProjectMember) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;
    await projectService
      .inviteProject(workspaceSlug as string, projectId as string, formData)
      .then((response) => {
        setIsOpen(false);
        mutate(
          PROJECT_INVITATIONS,
          (prevData: any[]) => {
            return [{ ...formData, ...response }, ...(prevData ?? [])];
          },
          false
        );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Member added successfully",
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleClose = () => {
    setIsOpen(false);
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Invite Members
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Invite members to work on your project.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Controller
                          control={control}
                          name="user_id"
                          rules={{ required: "Please select a member" }}
                          render={({ field: { value, onChange } }) => (
                            <Listbox
                              value={value}
                              onChange={(data: any) => {
                                onChange(data.id);
                                setValue("member_id", data.id);
                                setValue("email", data.email);
                              }}
                            >
                              {({ open }) => (
                                <>
                                  <Listbox.Label className="mb-2 text-gray-500">
                                    Email
                                  </Listbox.Label>
                                  <div className="relative">
                                    <Listbox.Button
                                      className={`relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
                                        errors.user_id ? "border-red-500 bg-red-50" : ""
                                      }`}
                                    >
                                      <span className="block truncate">
                                        {value && value !== ""
                                          ? people?.find((p) => p.member.id === value)?.member.email
                                          : "Select email"}
                                      </span>
                                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronDownIcon
                                          className="h-5 w-5 text-gray-400"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    </Listbox.Button>

                                    <Transition
                                      show={open}
                                      as={React.Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {uninvitedPeople?.length === 0 ? (
                                          <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-left text-gray-600">
                                            Invite to workspace to add members
                                          </div>
                                        ) : (
                                          uninvitedPeople?.map((person) => (
                                            <Listbox.Option
                                              key={person.member.id}
                                              className={({ active }) =>
                                                `${
                                                  active ? "bg-theme text-white" : "text-gray-900"
                                                } relative cursor-default select-none py-2 pl-3 pr-9 text-left`
                                              }
                                              value={{
                                                id: person.member.id,
                                                email: person.member.email,
                                              }}
                                            >
                                              {({ selected, active }) => (
                                                <>
                                                  <span
                                                    className={`${
                                                      selected ? "font-semibold" : "font-normal"
                                                    } block truncate`}
                                                  >
                                                    {person.member.email}
                                                  </span>

                                                  {selected ? (
                                                    <span
                                                      className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                        active ? "text-white" : "text-theme"
                                                      }`}
                                                    >
                                                      <CheckIcon
                                                        className="h-5 w-5"
                                                        aria-hidden="true"
                                                      />
                                                    </span>
                                                  ) : null}
                                                </>
                                              )}
                                            </Listbox.Option>
                                          ))
                                        )}
                                      </Listbox.Options>
                                    </Transition>
                                  </div>
                                  <p className="text-sm text-red-400">
                                    {errors.user_id && errors.user_id.message}
                                  </p>
                                </>
                              )}
                            </Listbox>
                          )}
                        ></Controller>
                      </div>
                      <div>
                        <div>
                          <Select
                            id="role"
                            label="Role"
                            name="role"
                            error={errors.role}
                            register={register}
                            validations={{
                              required: "Role is required",
                            }}
                            options={Object.entries(ROLE).map(([key, value]) => ({
                              value: key,
                              label: value,
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <TextArea
                          id="message"
                          name="message"
                          label="Message"
                          placeholder="Enter message"
                          error={errors.message}
                          register={register}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button theme="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                    </Button>
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
