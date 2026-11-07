/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { SendFilled, StopFilled } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// components
import { Button } from "@/components/ui/shadcn/button";
import { Textarea } from "@/components/ui/shadcn/textarea";
// local imports
import { KHAIA_NAME } from "./constants";

type Props = {
  canPrompt: boolean;
  prompting: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Controls under the input (the permission level). */
  toolbar?: ReactNode;
  inputRef?: Ref<HTMLTextAreaElement>;
};

/**
 * The widget's message box: Enter sends, Shift+Enter adds a line, Stop while a turn runs. No
 * keyboard hint, unlike the full page: the window is too narrow for it next to the toolbar.
 */
export function KhaiaComposer({ canPrompt, prompting, onSend, onStop, toolbar, inputRef }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const canSend = canPrompt && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2 rounded-lg border border-subtle bg-layer-1 p-1.5 focus-within:border-accent-strong">
        <Textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("agents.composer.placeholder", { name: KHAIA_NAME })}
          aria-label={t("agents.composer.label")}
          className="max-h-40 min-h-8 border-0 bg-transparent px-1.5 py-1.5 focus-visible:border-0"
        />
        {prompting ? (
          <Button type="button" variant="secondary" size="icon" aria-label={t("agents.composer.stop")} onClick={onStop}>
            <StopFilled />
          </Button>
        ) : (
          <Button type="submit" size="icon" aria-label={t("agents.composer.send")} disabled={!canSend}>
            <SendFilled />
          </Button>
        )}
      </div>
      {toolbar && <div className="flex min-w-0 flex-wrap items-center gap-0.5">{toolbar}</div>}
    </form>
  );
}
