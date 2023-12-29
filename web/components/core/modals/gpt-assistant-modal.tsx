import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form"; // services
import { AIService } from "services/ai.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// components
import { RichReadOnlyEditorWithRef } from "@plane/rich-text-editor";

type Props = {
  isOpen: boolean;
  projectId: string;
  handleClose: () => void;
  onResponse: (response: any) => void;
  onError?: (error: any) => void;
  prompt?: string;
};

type FormData = {
  prompt: string;
  task: string;
};

const aiService = new AIService();

export const GptAssistantModal: React.FC<Props> = ({ isOpen, projectId, handleClose, onResponse, onError, prompt }) => {
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const editorRef = useRef<any>(null);
  const responseRef = useRef<any>(null);
  const { setToastAlert } = useToast();

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
    <>
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
          <div className="page-block-section text-sm">
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
    </>
  );
};
