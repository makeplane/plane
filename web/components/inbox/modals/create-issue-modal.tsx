import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
import { Controller, useForm } from "react-hook-form";
import { RichTextEditorWithRef } from "@plane/rich-text-editor";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { FileService } from "services/file.service";
// components
import { IssuePrioritySelect } from "components/issues/select";
// ui
import { Button, Input, ToggleSwitch } from "@plane/ui";
// types
import { IIssue } from "types";
import useEditorSuggestions from "hooks/use-editor-suggestions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: Partial<IIssue> = {
  project: "",
  name: "",
  description_html: "<p></p>",
  parent: null,
  priority: "none",
};

// services
const fileService = new FileService();

export const CreateInboxIssueModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;

  // states
  const [createMore, setCreateMore] = useState(false);

  const editorRef = useRef<any>(null);

  const editorSuggestion = useEditorSuggestions();

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxIssueDetails: inboxIssueDetailsStore } = useMobxStore();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const handleClose = () => {
    onClose();
    reset(defaultValues);
  };

  const handleFormSubmit = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId || !inboxId) return;

    await inboxIssueDetailsStore
      .createIssue(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), formData)
      .then((res) => {
        if (!createMore) {
          router.push(`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?inboxIssueId=${res.issue_inbox[0].id}`);
          handleClose();
        } else reset(defaultValues);
      });
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
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
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="space-y-5">
                    <h3 className="text-xl font-semibold leading-6 text-custom-text-100">Create Inbox Issue</h3>
                    <div className="space-y-3">
                      <div className="mt-2 space-y-3">
                        <div>
                          <Controller
                            control={control}
                            name="name"
                            rules={{
                              required: "Title is required",
                              maxLength: {
                                value: 255,
                                message: "Title should be less than 255 characters",
                              },
                            }}
                            render={({ field: { value, onChange, ref } }) => (
                              <Input
                                id="name"
                                name="name"
                                type="text"
                                value={value}
                                onChange={onChange}
                                ref={ref}
                                hasError={Boolean(errors.name)}
                                placeholder="Title"
                                className="resize-none text-xl w-full"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Controller
                            name="description_html"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <RichTextEditorWithRef
                                cancelUploadImage={fileService.cancelUpload}
                                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                                deleteFile={fileService.deleteImage}
                                ref={editorRef}
                                debouncedUpdatesEnabled={false}
                                value={!value || value === "" ? "<p></p>" : value}
                                customClassName="min-h-[150px]"
                                onChange={(description, description_html: string) => {
                                  onChange(description_html);
                                }}
                                mentionSuggestions={editorSuggestion.mentionSuggestions}
                                mentionHighlights={editorSuggestion.mentionHighlights}
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Controller
                            control={control}
                            name="priority"
                            render={({ field: { value, onChange } }) => (
                              <IssuePrioritySelect value={value ?? "none"} onChange={onChange} />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="-mx-5 mt-5 flex items-center justify-between gap-2 border-t border-custom-border-200 px-5 pt-5">
                    <div
                      className="flex cursor-pointer items-center gap-1"
                      onClick={() => setCreateMore((prevData) => !prevData)}
                    >
                      <span className="text-xs">Create more</span>
                      <ToggleSwitch value={createMore} onChange={() => {}} size="md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={() => handleClose()}>
                        Discard
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                        {isSubmitting ? "Adding Issue..." : "Add Issue"}
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
