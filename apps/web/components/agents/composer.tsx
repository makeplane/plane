/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "@makeplane/propel/components/button";
import { TextArea } from "@makeplane/propel/components/text-area";
import { SendOutline, StopOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";

type Props = {
  agentName: string;
  /** A prompt can be sent now (connected, session open, no turn running). */
  canPrompt: boolean;
  /** A turn is running: show Stop instead of Send. */
  prompting: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Controls shown left of the send button (the permission level). */
  toolbar?: ReactNode;
};

export function AgentChatComposer({ agentName, canPrompt, prompting, onSend, onStop, toolbar }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const canSend = canPrompt && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (event: KeyboardEvent<Element>) => {
    // Enter sends; Shift+Enter (and Enter while an IME is composing) adds a line.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextArea
        size="md"
        surface="field"
        autoResize
        maxRows={8}
        rows={2}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("agents.composer.placeholder", { name: agentName })}
        aria-label={t("agents.composer.label")}
        aria-describedby="agent-composer-hint"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">{toolbar}</div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span id="agent-composer-hint" className="hidden text-caption-sm-regular text-placeholder sm:inline">
            {t("agents.composer.hint")}
          </span>
          {prompting ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              stretch="auto"
              icon={<StopOutline />}
              label={t("agents.composer.stop")}
              onClick={onStop}
            />
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="md"
              stretch="auto"
              icon={<SendOutline />}
              label={t("agents.composer.send")}
              disabled={!canSend}
            />
          )}
        </div>
      </div>
    </form>
  );
}
