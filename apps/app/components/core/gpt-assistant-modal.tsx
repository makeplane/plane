import { useEffect, useState } from "react";

import { useRouter } from "next/router";

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
  onResponse: (response: string) => void;
};

type FormData = {
  prompt: string;
  task: string;
};

export const GptAssistantModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  inset = "top-0 left-0",
  content,
  onResponse,
}) => {
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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

    if (!content || content === "") {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please enter some description to get AI assistance.",
      });
      return;
    }

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
        prompt: content,
        task: formData.task,
      })
      .then((res) => {
        setResponse(res.response);
        setFocus("task");

        if (res.response === "") setInvalidResponse(true);
        else setInvalidResponse(false);
      });
  };

  useEffect(() => {
    if (isOpen) setFocus("task");
  }, [isOpen, setFocus]);

  return (
    <div
      className={`absolute ${inset} z-20 w-full rounded-[10px] border bg-white p-4 shadow ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <form onSubmit={handleSubmit(handleResponse)} className="space-y-4">
        <div className="text-sm">
          Content: <p className="text-gray-500">{content}</p>
        </div>
        {response !== "" && (
          <div className="text-sm">
            Response: <p className="text-gray-500">{response}</p>
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
          placeholder="Tell OpenAI what action to perform on this content..."
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
            <PrimaryButton type="submit" loading={isSubmitting}>
              {isSubmitting
                ? "Generating response..."
                : response === ""
                ? "Generate response"
                : "Generate again"}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </div>
  );
};
