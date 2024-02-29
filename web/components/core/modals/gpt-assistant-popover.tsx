import React, { useEffect, useState, useRef, Fragment } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form"; // services
import { AIService } from "services/ai.service";
// hooks
import useToast from "hooks/use-toast";
import { usePopper } from "react-popper";
// ui
import { Button, Input } from "@plane/ui";
// components
import { RichReadOnlyEditorWithRef } from "@plane/rich-text-editor";
import { Popover, Transition } from "@headlessui/react";
// types
import { Placement } from "@popperjs/core";

type Props = {
  isOpen: boolean;
  projectId: string;
  handleClose: () => void;
  onResponse: (response: any) => void;
  onError?: (error: any) => void;
  placement?: Placement;
  prompt?: string;
  button: JSX.Element;
  className?: string;
};

type FormData = {
  prompt: string;
  task: string;
};

const aiService = new AIService();

export const GptAssistantPopover: React.FC<Props> = (props) => {
  const { isOpen, projectId, handleClose, onResponse, onError, placement, prompt, button, className = "" } = props;
  // states
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const responseRef = useRef<any>(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
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

    setToastAlert({
      type: "error",
      title: "Error!",
      message: errorMessage,
    });

    if (onError) onError(err);
  };

  const callAIService = async (formData: FormData) => {
    try {
      const res = await aiService.createGptTask(workspaceSlug as string, projectId, {
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
    setToastAlert({
      type: "error",
      title: "Error!",
      message: "Please enter some task to get AI assistance.",
    });
  };

  const handleAIResponse = async (formData: FormData) => {
    if (!workspaceSlug || !projectId) return;

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
        <button ref={setReferenceElement}>{button}</button>
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
          className={`fixed z-10 flex flex-col w-full max-w-full min-w-[50rem] space-y-4 overflow-hidden rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4 shadow ${className}`}
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="vertical-scroll-enable max-h-72 space-y-4 overflow-y-auto">
            {prompt && (
              <div className="text-sm">
                Content:
                <RichReadOnlyEditorWithRef
                  value={prompt}
                  customClassName="-m-3"
                  noBorder
                  borderOnFocus={false}
                  ref={editorRef}
                />
              </div>
            )}
            {response !== "" && (
              <div className="page-block-section text-sm max-h-[8rem]">
                Response:
                <RichReadOnlyEditorWithRef
                  value={`<p>${response}</p>`}
                  customClassName={response ? "-mx-3 -my-3" : ""}
                  noBorder
                  borderOnFocus={false}
                  ref={responseRef}
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
              />
            )}
          />
          <div className={`flex gap-2 ${response === "" ? "justify-end" : "justify-between"}`}>
            {responseActionButton}
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
