import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { useForm, Controller } from "react-hook-form";

import { Dialog, Transition } from "@headlessui/react";
// ui
import { CustomSelect, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// hooks
import useToast from "hooks/use-toast";
// types
import { ICurrentUserResponse, IProjectMemberInvitation } from "types";
// fetch-keys
import { PROJECT_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  members: any[];
  user: ICurrentUserResponse | undefined;
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

const SendProjectInvitationModal: React.FC<Props> = ({ isOpen, setIsOpen, members, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();
  const { memberDetails } = useProjectMyMembership();

  const { data: people } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
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
      .inviteProject(workspaceSlug as string, projectId as string, formData, user)
      .then((response) => {
        setIsOpen(false);
        mutate<any[]>(
          PROJECT_INVITATIONS,
          (prevData) => {
            if (!prevData) return prevData;
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
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-brand-surface-2 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-brand-base">
                      Invite Members
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-brand-secondary">
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
                            <CustomSelect
                              value={value}
                              label={
                                <div
                                  className={`${errors.user_id ? "border-red-500 bg-red-50" : ""}`}
                                >
                                  {value && value !== ""
                                    ? people?.find((p) => p.member.id === value)?.member.email
                                    : "Select email"}
                                </div>
                              }
                              onChange={(val: string) => {
                                onChange(val);
                                const person = uninvitedPeople?.find((p) => p.member.id === val);

                                setValue("member_id", val);
                                setValue("email", person?.member.email ?? "");
                              }}
                              input
                              width="w-full"
                            >
                              {uninvitedPeople && uninvitedPeople.length > 0 ? (
                                <>
                                  {uninvitedPeople?.map((person) => (
                                    <CustomSelect.Option
                                      key={person.member.id}
                                      value={person.member.id}
                                    >
                                      {person.member.email}
                                    </CustomSelect.Option>
                                  ))}
                                </>
                              ) : (
                                <div className="text-center text-sm py-5">
                                  Invite members to workspace before adding them to a project.
                                </div>
                              )}
                            </CustomSelect>
                          )}
                        />
                      </div>
                      <div>
                        <h6 className="text-brand-secondary">Role</h6>
                        <Controller
                          name="role"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              {...field}
                              label={
                                <span className="capitalize">
                                  {field.value ? ROLE[field.value] : "Select role"}
                                </span>
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
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                    </PrimaryButton>
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
