import { useEffect, useState } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import aiService from "services/ai.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  inset?: string;
  content: string;
  htmlContent?: string;
  onResponse: (response: string) => void;
  projectId: string;
};

type FormData = {
  prompt: string;
  task: string;
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
});

export const GptAssistantModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  inset = "top-0 left-0",
  content,
  htmlContent,
  onResponse,
  projectId,
}) => {
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    register,
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
      .createGptTask(workspaceSlug as string, projectId as string, {
        prompt: content && content !== "" ? content : htmlContent ?? "",
        task: formData.task,
      })
      .then((res) => {
        setResponse(res.response_html);
        setFocus("task");

        if (res.response === "") setInvalidResponse(true);
        else setInvalidResponse(false);
      })
      .catch((err) => {
        if (err.status === 429)
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Some error occurred. Please try again.",
          });
      });
  };

  useEffect(() => {
    if (isOpen) setFocus("task");
  }, [isOpen, setFocus]);

  return (
    <div
      className={`absolute ${inset} z-20 w-full space-y-4 rounded-[10px] border bg-white p-4 shadow ${
        isOpen ? "block" : "hidden"
      }`}
    >
      {((content && content !== "") || htmlContent) && (
        <div className="text-sm page-block-section">
          Content:
          <RemirrorRichTextEditor
            value={htmlContent ?? <p>{content}</p>}
            customClassName="-mx-3 -my-3"
            noBorder
            borderOnFocus={false}
            editable={false}
          />
        </div>
      )}
      {response !== "" && (
        <div className="text-sm page-block-section">
          Response:
          <RemirrorRichTextEditor
            value={`<p>${response}</p>`}
            customClassName="-mx-3 -my-3"
            noBorder
            borderOnFocus={false}
            editable={false}
          />
        </div>
      )}
      {invalidResponse && (
        <div className="text-sm text-red-500">
          No response could be generated. This may be due to insufficient content or task
          information. Please try again.
        </div>
      )}
      <Input
        type="text"
        name="task"
        register={register}
        placeholder={`${
          content && content !== ""
            ? "Tell AI what action to perform on this content..."
            : "Ask AI anything..."
        }`}
        autoComplete="off"
      />
      <div className={`flex gap-2 ${response === "" ? "justify-end" : "justify-between"}`}>
        {response !== "" && (
          <PrimaryButton
            onClick={() => {
              onResponse(response);
              onClose();
            }}
          >
            Use this response
          </PrimaryButton>
        )}
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit(handleResponse)}
            loading={isSubmitting}
          >
            {isSubmitting
              ? "Generating response..."
              : response === ""
              ? "Generate response"
              : "Generate again"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
