import React, { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, CustomSelect, Input } from "@plane/ui";
// icons
import { Plus, X } from "lucide-react";
// types
import { IWorkspaceBulkInviteFormData, TUserWorkspaceRole } from "types";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void> | undefined;
};

type EmailRole = {
  email: string;
  role: TUserWorkspaceRole;
};

type FormValues = {
  emails: EmailRole[];
};

const defaultValues: FormValues = {
  emails: [
    {
      email: "",
      role: 15,
    },
  ],
};

export const SendWorkspaceInvitationModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onSubmit } = props;

  // form info
  const {
    control,
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emails",
  });

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 350);
  };

  // const onSubmit = async (formData: FormValues) => {
  //   if (!workspaceSlug) return;

  //   return workspaceService
  //     .inviteWorkspace(workspaceSlug, formData, user)

  //     .then(async () => {
  //       if (onSuccess) await onSuccess();
  //       handleClose();
  //       setToastAlert({
  //         type: "success",
  //         title: "Success!",
  //         message: "Invitations sent successfully.",
  //       });
  //     })
  //     .catch((err) =>
  //       setToastAlert({
  //         type: "error",
  //         title: "Error!",
  //         message: `${err.error ?? "Something went wrong. Please try again."}`,
  //       })
  //     );
  // };

  const appendField = () => {
    append({ email: "", role: 15 });
  };

  useEffect(() => {
    if (fields.length === 0) append([{ email: "", role: 15 }]);
  }, [fields, append]);

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
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-100 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl opacity-100 translate-y-0 sm:scale-100">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  onKeyDown={(e) => {
                    if (e.code === "Enter") e.preventDefault();
                  }}
                >
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Invite people to collaborate
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-custom-text-200">Invite members to work on your workspace.</p>
                    </div>

                    <div className="space-y-4 mb-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="group relative grid grid-cols-11 gap-4">
                          <div className="col-span-7">
                            <Controller
                              control={control}
                              name={`emails.${index}.email`}
                              rules={{
                                required: "Email ID is required",
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: "Invalid Email ID",
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
                                    placeholder="Enter their email..."
                                    className="text-xs sm:text-sm w-full"
                                  />
                                  {errors.emails?.[index]?.email && (
                                    <span className="ml-1 text-red-500 text-xs">
                                      {errors.emails?.[index]?.email?.message}
                                    </span>
                                  )}
                                </>
                              )}
                            />
                          </div>
                          <div className="col-span-3">
                            <Controller
                              control={control}
                              name={`emails.${index}.role`}
                              rules={{ required: true }}
                              render={({ field: { value, onChange } }) => (
                                <CustomSelect
                                  value={value}
                                  label={<span className="text-xs sm:text-sm">{ROLE[value]}</span>}
                                  onChange={onChange}
                                  width="w-full"
                                  input
                                >
                                  {Object.entries(ROLE).map(([key, value]) => (
                                    <CustomSelect.Option key={key} value={parseInt(key)}>
                                      {value}
                                    </CustomSelect.Option>
                                  ))}
                                </CustomSelect>
                              )}
                            />
                          </div>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              className="self-center place-items-center rounded -ml-3"
                              onClick={() => remove(index)}
                            >
                              <X className="h-3.5 w-3.5 text-custom-text-200" />
                            </button>
                          )}
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
                      <Plus className="h-4 w-4" />
                      Add more
                    </button>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={isSubmitting}>
                        {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
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
