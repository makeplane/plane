"use client";

import React, { useEffect, useState, useRef, Fragment, Ref } from "react";
import { Placement } from "@popperjs/core";
import { Controller, useForm } from "react-hook-form"; // services
import { usePopper } from "react-popper";
import { AlertCircle } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { RichTextReadOnlyEditor } from "@/components/editor/rich-text-editor/rich-text-read-only-editor";
// services
import { AIService } from "@/services/ai.service";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onResponse: (response: any) => void;
  onError?: (error: any) => void;
  placement?: Placement;
  prompt?: string;
  button: JSX.Element;
  className?: string;
  workspaceSlug: string;
  projectId: string;
};

type FormData = {
  prompt: string;
  task: string;
};

const aiService = new AIService();

export const GptAssistantPopover: React.FC<Props> = (props) => {
  const {
    isOpen,
    handleClose,
    onResponse,
    onError,
    placement,
    prompt,
    button,
    className = "",
    workspaceSlug,
    projectId,
  } = props;
  // states
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const responseRef = useRef<any>(null);
  // popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });
  // form
  const {
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      prompt: prompt || "",
      task: "",
    },
  });

  const onClose = () => {
    handleClose();
    setResponse("");
    setInvalidResponse(false);
    reset();
  };

  const handleServiceError = (err: any) => {
    const error = err?.data?.error;
    const errorMessage =
      err?.status === 429
        ? error || "You have reached the maximum number of requests of 50 requests per month per user."
        : error || "Some error occurred. Please try again.";

    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Error!",
      message: errorMessage,
    });

    if (onError) onError(err);
  };

  const callAIService = async (formData: FormData) => {
    try {
      const res = await aiService.createGptTask(workspaceSlug.toString(), {
        prompt: prompt || "",
        task: formData.task,
      });

      setResponse(res.response_html);
      setFocus("task");

      setInvalidResponse(res.response === "");
    } catch (err) {
      handleServiceError(err);
    }
  };

  const handleInvalidTask = () => {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Error!",
      message: "Please enter some task to get AI assistance.",
    });
  };

  const handleAIResponse = async (formData: FormData) => {
    if (!workspaceSlug) return;

    if (formData.task === "") {
      handleInvalidTask();
      return;
    }

    await callAIService(formData);
  };

  useEffect(() => {
    if (isOpen) setFocus("task");
  }, [isOpen, setFocus]);

  useEffect(() => {
    editorRef.current?.setEditorValue(prompt || "");
  }, [editorRef, prompt]);

  useEffect(() => {
    responseRef.current?.setEditorValue(`<p>${response}</p>`);
  }, [response, responseRef]);

  useEffect(() => {
    const handleEnterKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(handleAIResponse)();
      }
    };

    const handleEscapeKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEnterKeyPress);
      window.addEventListener("keydown", handleEscapeKeyPress);
    }

    return () => {
      window.removeEventListener("keydown", handleEnterKeyPress);
      window.removeEventListener("keydown", handleEscapeKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, handleSubmit, onClose]);

  const responseActionButton = response !== "" && (
    <Button
      variant="primary"
      onClick={() => {
        onResponse(response);
        onClose();
      }}
    >
      Use this response
    </Button>
  );

  const generateResponseButtonText = isSubmitting
    ? "Generating response..."
    : response === ""
      ? "Generate response"
      : "Generate again";

  return (
    <Popover as="div" className={`relative w-min text-left`}>
      <Popover.Button as={Fragment}>
        <button ref={setReferenceElement} className="flex items-center">
          {button}
        </button>
      </Popover.Button>
      <Transition
        show={isOpen}
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel
          as="div"
          className={`fixed z-10 flex w-full min-w-[50rem] max-w-full flex-col space-y-4 overflow-hidden rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4 shadow ${className}`}
          ref={setPopperElement as Ref<HTMLDivElement>}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="vertical-scroll-enable max-h-72 space-y-4 overflow-y-auto">
            {prompt && (
              <div className="text-sm">
                Content:
                <RichTextReadOnlyEditor
                  id="ai-assistant-content"
                  initialValue={prompt}
                  containerClassName="-m-3"
                  ref={editorRef}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              </div>
            )}
            {response !== "" && (
              <div className="page-block-section max-h-[8rem] text-sm">
                Response:
                <RichTextReadOnlyEditor
                  id="ai-assistant-response"
                  initialValue={`<p>${response}</p>`}
                  ref={responseRef}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              </div>
            )}
            {invalidResponse && (
              <div className="text-sm text-red-500">
                No response could be generated. This may be due to insufficient content or task information. Please try
                again.
              </div>
            )}
          </div>
          <Controller
            control={control}
            name="task"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="task"
                name="task"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={`${
                  prompt && prompt !== "" ? "Tell AI what action to perform on this content..." : "Ask AI anything..."
                }`}
                className="w-full"
                autoFocus
              />
            )}
          />
          <div className="flex gap-2 justify-between">
            {responseActionButton ? (
              <>{responseActionButton}</>
            ) : (
              <>
                <div className="flex items-start justify-center gap-2 text-sm text-custom-primary">
                  <AlertCircle className="h-4 w-4" />
                  <p>By using this feature, you consent to sharing the message with a 3rd party service. </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit(handleAIResponse)} loading={isSubmitting}>
                {generateResponseButtonText}
              </Button>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
