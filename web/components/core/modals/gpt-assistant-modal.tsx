import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import { AIService } from "services/ai.service";
import { TrackEventService } from "services/track_event.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { Button, Input } from "@plane/ui";
// components
import { RichReadOnlyEditor, RichReadOnlyEditorWithRef } from "@plane/rich-text-editor";
// types
import { IIssue, IPageBlock } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  inset?: string;
  content: string;
  htmlContent?: string;
  onResponse: (response: string) => void;
  projectId: string;
  block?: IPageBlock;
  issue?: IIssue;
};

type FormData = {
  prompt: string;
  task: string;
};

// services
const aiService = new AIService();
const trackEventService = new TrackEventService();

export const GptAssistantModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  inset = "top-0 left-0",
  content,
  htmlContent,
  onResponse,
  projectId,
  block,
  issue,
}) => {
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const editorRef = useRef<any>(null);

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      prompt: content,
      task: "",
    },
  });

  const onClose = () => {
    handleClose();
    setResponse("");
    setInvalidResponse(false);
    reset();
  };

  const handleResponse = async (formData: FormData) => {
    if (!workspaceSlug || !projectId) return;

    if (formData.task === "") {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please enter some task to get AI assistance.",
      });
      return;
    }

    await aiService
      .createGptTask(
        workspaceSlug as string,
        projectId as string,
        {
          prompt: content && content !== "" ? content : htmlContent ?? "",
          task: formData.task,
        },
        user
      )
      .then((res) => {
        setResponse(res.response_html);
        setFocus("task");

        if (res.response === "") setInvalidResponse(true);
        else setInvalidResponse(false);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: error || "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: error || "Some error occurred. Please try again.",
          });
      });
  };

  useEffect(() => {
    if (isOpen) setFocus("task");
  }, [isOpen, setFocus]);

  useEffect(() => {
    editorRef.current?.setEditorValue(htmlContent ?? `<p>${content}</p>`);
  }, [htmlContent, editorRef, content]);

  return (
    <div
      className={`absolute ${inset} z-20 w-full space-y-4 rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4 shadow ${
        isOpen ? "block" : "hidden"
      }`}
    >
      {((content && content !== "") || (htmlContent && htmlContent !== "<p></p>")) && (
        <div className="text-sm">
          Content:
          <RichReadOnlyEditorWithRef
            value={htmlContent ?? `<p>${content}</p>`}
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
          <RichReadOnlyEditor
            value={`<p>${response}</p>`}
            customClassName="-mx-3 -my-3"
            noBorder
            borderOnFocus={false}
          />
        </div>
      )}
      {invalidResponse && (
        <div className="text-sm text-red-500">
          No response could be generated. This may be due to insufficient content or task information. Please try again.
        </div>
      )}
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
              content && content !== "" ? "Tell AI what action to perform on this content..." : "Ask AI anything..."
            }`}
            className="w-full"
          />
        )}
      />
      <div className={`flex gap-2 ${response === "" ? "justify-end" : "justify-between"}`}>
        {response !== "" && (
          <Button
            variant="primary"
            onClick={() => {
              onResponse(response);
              onClose();
              if (block && user)
                trackEventService.trackUseGPTResponseEvent(block, "USE_GPT_RESPONSE_IN_PAGE_BLOCK", user);
              else if (issue && user)
                trackEventService.trackUseGPTResponseEvent(issue, "USE_GPT_RESPONSE_IN_ISSUE", user);
            }}
          >
            Use this response
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit(handleResponse)} loading={isSubmitting}>
            {isSubmitting ? "Generating response..." : response === "" ? "Generate response" : "Generate again"}
          </Button>
        </div>
      </div>
    </div>
  );
};
