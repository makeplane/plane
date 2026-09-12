/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatScope } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// hooks
import { useChat } from "@/hooks/store/use-chat";

type Props = {
  scope: TChatScope;
  isOpen: boolean;
  handleClose: () => void;
};

export const ChatCreateChannelModal = observer(function ChatCreateChannelModal(props: Props) {
  const { scope, isOpen, handleClose } = props;
  // states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  // store hooks
  const { createChannel } = useChat();

  // put the cursor in the name field when the modal opens
  useEffect(() => {
    if (isOpen) window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [isOpen]);

  const close = () => {
    setName("");
    setDescription("");
    handleClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await createChannel(scope, { name: trimmed, description: description.trim() });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Channel created." });
      close();
    } catch (error: unknown) {
      const data = error as { error?: string; name?: string[] } | undefined;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: data?.error ?? data?.name?.[0] ?? "Channel could not be created.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={close} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <h3 className="text-16 font-medium text-primary">Create channel</h3>
        <div className="flex flex-col gap-1">
          <label htmlFor="chat-channel-name" className="text-12 text-secondary">
            Name
          </label>
          <Input
            id="chat-channel-name"
            name="name"
            type="text"
            inputSize="sm"
            placeholder="e.g. design, random"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            ref={nameInputRef}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="chat-channel-description" className="text-12 text-secondary">
            Description (optional)
          </label>
          <Input
            id="chat-channel-description"
            name="description"
            type="text"
            inputSize="sm"
            placeholder="What is this channel about?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" type="button" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={!name.trim()}>
            {isSubmitting ? "Creating" : "Create channel"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
