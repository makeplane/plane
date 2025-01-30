"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { ROLE, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// ui
import { Button, CustomSelect, Input } from "@plane/ui";
// constants
// hooks
import { useUserPermissions } from "@/hooks/store";
// types

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void> | undefined;
};

type EmailRole = {
  email: string;
  role: EUserPermissions;
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

export const SendWorkspaceInvitationModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, onSubmit } = props;
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
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

  const currentWorkspaceRole = workspaceInfoBySlug(workspaceSlug.toString())?.role;

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 350);
  };

  const appendField = () => {
    append({ email: "", role: 15 });
  };

  const onSubmitForm = async (data: FormValues) => {
    await onSubmit(data)?.then(() => {
      reset(defaultValues);
    });
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
              <Dialog.Panel className="relative translate-y-0 transform rounded-lg bg-custom-background-100 p-5 text-left opacity-100 shadow-custom-shadow-md transition-all w-full sm:max-w-2xl sm:scale-100">
                <form
                  onSubmit={handleSubmit(onSubmitForm)}
                  onKeyDown={(e) => {
                    if (e.code === "Enter") e.preventDefault();
                  }}
                >
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      {t("workspace_settings.settings.members.modal.title")}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-custom-text-200">
                        {t("workspace_settings.settings.members.modal.description")}
                      </p>
                    </div>

                    <div className="mb-3 space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="relative group mb-1 flex items-start justify-between gap-x-4 text-sm w-full"
                        >
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
                                    <span className="ml-1 text-xs text-red-500">
                                      {errors.emails?.[index]?.email?.message}
                                    </span>
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
                          ? t("workspace_settings.settings.members.modal.button_loading")
                          : t("workspace_settings.settings.members.modal.button")}
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
