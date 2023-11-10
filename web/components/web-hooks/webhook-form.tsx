import React, { FC, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, ToggleSwitch } from "@plane/ui";
import { IWebhook, IExtendedWebhook } from "types";
import { GenerateKey } from "./generate-key";
import { observer } from "mobx-react-lite";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DeleteWebhookModal } from "./delete-webhook-modal";

interface IWebhookDetails {
  type: "create" | "edit";
  initialData: IWebhook;
  onSubmit: (val: IExtendedWebhook) => void;
}

export const WebhookDetails: FC<IWebhookDetails> = observer((props) => {
  const { type, initialData, onSubmit } = props;
  // states
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  // use form
  const {
    reset,
    watch,
    handleSubmit,
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<IExtendedWebhook>();

  const checkWebhookEvent = (initialData: IWebhook) => {
    const { project, module, cycle, issue, issue_comment } = initialData;
    if (!project || !cycle || !module || !issue || !issue_comment) {
      return "individual";
    }
    return "all";
  };

  useEffect(() => {
    if (initialData && reset) reset({ ...initialData, webhook_events: checkWebhookEvent(initialData) });
  }, [initialData, reset]);

  useEffect(() => {
    if (watch("webhook_events")) {
      if (watch("webhook_events") === "all")
        reset({
          ...getValues(),
          project: watch("project") ?? true,
          module: watch("module") ?? true,
          cycle: watch("cycle") ?? true,
          issue: watch("issue") ?? true,
          issue_comment: watch("issue_comment") ?? true,
        });
      if (watch("webhook_events") === "individual")
        reset({
          ...getValues(),
          project: watch("project") ?? false,
          module: watch("module") ?? false,
          cycle: watch("cycle") ?? false,
          issue: watch("issue") ?? false,
          issue_comment: watch("issue_comment") ?? false,
        });
    }
  }, [watch && watch("webhook_events")]);

  return (
    <>
      <DeleteWebhookModal
        isOpen={openDeleteModal}
        webhook_url=""
        onClose={() => {
          setOpenDeleteModal(false);
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8 py-5">
          <div>
            <div className="font-medium text-sm">URL</div>
            <Controller
              control={control}
              name="url"
              rules={{
                required: "URL is Required",
                validate: (value) => (/^(ftp|http|https):\/\/[^ "]+$/.test(value) ? true : "Enter a valid URL"),
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  className="w-full"
                  onChange={onChange}
                  value={value}
                  id="url"
                  autoComplete="off"
                  placeholder="Enter URL"
                />
              )}
            />
            {errors.url && <p className="py-2 text-sm text-red-500">{errors.url.message}</p>}
          </div>

          <div className="flex gap-6">
            <div className="text-sm"> Enable webhook</div>
            <Controller
              control={control}
              name="is_active"
              render={({ field: { onChange, value } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                  }}
                  size="sm"
                />
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Which events do you like to trigger this webhook</div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="webhook_events"
                render={({ field: { onChange, value } }) => (
                  <input
                    id="all"
                    type="radio"
                    name="webhook_events"
                    value="all"
                    checked={value == "all"}
                    onChange={() => onChange("all")}
                  />
                )}
              />
              <label className="text-sm" htmlFor="all">
                Send everything
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="webhook_events"
                render={({ field: { onChange, value } }) => (
                  <input
                    id="individual"
                    type="radio"
                    name="webhook_events"
                    value="individual"
                    checked={value == "individual"}
                    onChange={() => onChange("individual")}
                  />
                )}
              />
              <label className="text-sm" htmlFor="individual">
                Select Individual events
              </label>
            </div>

            {watch("webhook_events") === "individual" && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-row gap-4 px-8 py-6 bg-custom-background-90">
                  <Controller
                    control={control}
                    name="project"
                    render={({ field: { onChange, value } }) => (
                      <div className="relative flex items-center gap-2">
                        <input
                          id="project_toggle"
                          onChange={() => onChange(!value)}
                          type="checkbox"
                          name="selectIndividualEvents"
                          checked={value == true}
                        />
                        <label className="text-sm" htmlFor="project_toggle">
                          Project
                        </label>
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="cycle"
                    render={({ field: { onChange, value } }) => (
                      <div className="flex items-center gap-2">
                        <input
                          id="cycle-toggle"
                          onChange={() => onChange(!value)}
                          type="checkbox"
                          name="selectIndividualEvents"
                          checked={value == true}
                        />
                        <label className="text-sm" htmlFor="cycle-toggle">
                          Cycles
                        </label>
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="issue"
                    render={({ field: { onChange, value } }) => (
                      <div className="flex items-center gap-2">
                        <input
                          id="issue_toggle"
                          onChange={() => onChange(!value)}
                          type="checkbox"
                          name="selectIndividualEvents"
                          checked={value == true}
                        />
                        <label className="text-sm" htmlFor="issue_toggle">
                          Issues
                        </label>
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="module"
                    render={({ field: { onChange, value } }) => (
                      <div className="flex items-center gap-2">
                        <input
                          id="module_toggle"
                          onChange={() => onChange(!value)}
                          type="checkbox"
                          name="selectIndividualEvents"
                          checked={value == true}
                        />
                        <label className="text-sm" htmlFor="module_toggle">
                          Module
                        </label>
                      </div>
                    )}
                  />

                  <Controller
                    control={control}
                    name="issue_comment"
                    render={({ field: { onChange, value } }) => (
                      <div className="flex items-center gap-2">
                        <input
                          id="issue_comment_toggle"
                          onChange={() => onChange(!value)}
                          type="checkbox"
                          name="selectIndividualEvents"
                          checked={value == true}
                        />
                        <label className="text-sm" htmlFor="issue_comment_toggle">
                          Issue Comment
                        </label>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <GenerateKey type={type} />

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "processing..." : type === "create" ? "Create webhook" : "Save webhook"}
            </Button>
          </div>
          {type === "edit" && (
            <Disclosure as="div" className="border-t border-custom-border-200">
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="flex items-center justify-between w-full py-4"
                  >
                    <span className="text-lg tracking-tight">Danger Zone</span>
                    {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Disclosure.Button>

                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel>
                      <div className="flex flex-col gap-8">
                        <span className="text-sm tracking-tight">
                          The danger zone of the workspace delete page is a critical area that requires careful
                          consideration and attention. When deleting a workspace, all of the data and resources within
                          that workspace will be permanently removed and cannot be recovered.
                        </span>
                        <div>
                          <Button
                            variant="danger"
                            onClick={() => {
                              setOpenDeleteModal(true);
                            }}
                          >
                            Delete Webhook
                          </Button>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          )}
        </div>
      </form>
    </>
  );
});
