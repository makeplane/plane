/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { useTranslation } from "@plane/i18n";

type Props = {
  disabled: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
};

export const Composer = observer(function Composer(props: Props) {
  const { disabled, isStreaming, onSend, onStop } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  const canSend = !disabled && !isStreaming && value.trim().length > 0;

  const handleSend = () => {
    const content = value.trim();
    if (!canSend) return;
    onSend(content);
    setValue("");
  };

  return (
    <form
      className="flex w-full flex-col gap-2 border-t border-subtle p-3"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <TextAreaField
        size="lg"
        resize="none"
        autoResize
        maxRows={6}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("copilot.placeholder")}
        aria-label={t("copilot.placeholder")}
        disabled={disabled}
        onKeyDown={(event) => {
          // Enter sends, Shift+Enter inserts a newline.
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
      />
      <div className="flex items-center justify-end gap-2">
        {isStreaming && (
          <Button variant="secondary" size="sm" stretch="auto" onClick={onStop} label={t("copilot.stop")} />
        )}
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          type="submit"
          disabled={!canSend}
          label={t("copilot.send")}
        />
      </div>
    </form>
  );
});
