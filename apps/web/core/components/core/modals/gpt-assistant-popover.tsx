/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form"; // services
import { WarningCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import type { EditorRefApi } from "@plane/editor";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { convertPlacementToSideAndAlign } from "@plane/blocks/utils";
import type { Placement } from "@plane/blocks/utils";
import { cn } from "@plane/utils";

// components
import { RichTextEditor } from "@/components/editor/rich-text";
// services
import { AIService } from "@/services/ai.service";
const aiService = new AIService();

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onResponse: (response: any) => void;
  onError?: (error: any) => void;
  placement?: Placement;
  prompt?: string;
  button: React.ReactNode;
  className?: string;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

type FormData = {
  prompt: string;
  task: string;
};

export function GptAssistantPopover(props: Props) {
  const {
    isOpen,
    handleClose,
    onResponse,
    onError,
    placement,
    prompt,
    button,
    className = "",
    workspaceId,
    workspaceSlug,
    projectId,
  } = props;
  // states
  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const responseRef = useRef<EditorRefApi>(null);
  // derived values
  const { side, align } = convertPlacementToSideAndAlign(placement ?? "auto");
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
      type: "error",
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
      type: "error",
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

    // Escape is Base UI's now: it closes the popover, which runs `onClose` through `onOpenChange`.
    if (isOpen) window.addEventListener("keydown", handleEnterKeyPress);

    return () => {
      window.removeEventListener("keydown", handleEnterKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, handleSubmit, onClose]);

  const responseActionButton = response !== "" && (
    <Button
      variant="primary"
      size="sm"
      stretch="auto"
      label="Use this response"
      onClick={() => {
        onResponse(response);
        onClose();
      }}
    />
  );

  const generateResponseButtonText = isSubmitting
    ? "Generating response..."
    : response === ""
      ? "Generate response"
      : "Generate again";

  return (
    <div className="relative w-min text-left">
      <Popover
        open={isOpen}
        onOpenChange={(nextOpen) => {
          // The caller's own button owns opening (`openOnClick={false}` below), so the only
          // transitions Base UI drives here are dismissals: Escape and outside press.
          if (!nextOpen) onClose();
        }}
      >
        {/* The trigger only anchors the panel: the `button` node the caller hands us already toggles
            `isOpen`, so a second toggle here would cancel it out. It stays out of the tab order,
            as the `<button tabIndex={-1}>` it replaces did. */}
        <PopoverTrigger
          nativeButton={false}
          openOnClick={false}
          tabIndex={-1}
          render={<span className="flex items-center" />}
        >
          {button}
        </PopoverTrigger>
        {/* The popover owns the portal, positioning, enter/leave and the panel surface, so
            the old popper positioning, enter/leave transition and hand-rolled chrome all go. */}
        <PopoverContent variant="rich" side={side} align={align}>
          <div className={cn("flex min-h-0 w-200 max-w-full flex-1 flex-col space-y-4 overflow-hidden", className)}>
            <PopoverBody tabIndex={0}>
              <div className="vertical-scroll-enable max-h-72 space-y-4 overflow-y-auto">
                {prompt && (
                  <div className="text-13">
                    Content:
                    <RichTextEditor
                      editable={false}
                      id="ai-assistant-content"
                      initialValue={prompt}
                      containerClassName="-m-3"
                      ref={editorRef}
                      workspaceId={workspaceId}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                    />
                  </div>
                )}
                {response !== "" && (
                  <div className="page-block-section max-h-[8rem] text-13">
                    Response:
                    <RichTextEditor
                      editable={false}
                      id="ai-assistant-response"
                      initialValue={`<p>${response}</p>`}
                      ref={responseRef}
                      workspaceId={workspaceId}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                    />
                  </div>
                )}
                {invalidResponse && (
                  <div className="text-13 text-danger-primary">
                    No response could be generated. This may be due to insufficient content or task information. Please
                    try again.
                  </div>
                )}
              </div>
            </PopoverBody>
            <Controller
              control={control}
              name="task"
              render={({ field: { value, onChange, ref } }) => (
                <InputGroup size="2xl">
                  <Input
                    size="2xl"
                    id="task"
                    name="task"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder={`${
                      prompt && prompt !== ""
                        ? "Tell AI what action to perform on this content..."
                        : "Ask AI anything..."
                    }`}
                    autoFocus
                  />
                </InputGroup>
              )}
            />
            <div className="flex justify-between gap-2">
              {responseActionButton ? (
                <>{responseActionButton}</>
              ) : (
                <>
                  <div className="flex items-start justify-center gap-2 text-13 text-accent-primary">
                    <WarningCircleOutline className="h-4 w-4" />
                    <p>By using this feature, you consent to sharing the message with a 3rd party service. </p>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" stretch="auto" label="Close" onClick={onClose} />
                <Button
                  variant="primary"
                  size="sm"
                  stretch="auto"
                  label={generateResponseButtonText}
                  onClick={handleSubmit(handleAIResponse)}
                  loading={isSubmitting}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
