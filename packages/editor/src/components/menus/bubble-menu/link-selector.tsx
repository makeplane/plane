/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";

import { useCallback, useId, useRef, useState } from "react";
import { DeleteOutline, LinkOutline, TickOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { PopoverPopup } from "@makeplane/propel/elements/popover";
import { ToolbarMenuTriggerButton, ToolbarMenuTriggerLabel } from "@makeplane/propel/elements/toolbar";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { setLinkEditor, unsetLinkEditor } from "@/helpers/editor-commands";
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";

type Props = {
  editor: Editor;
};

export function BubbleMenuLinkSelector(props: Props) {
  const { editor } = props;
  const errorId = useId();
  // states
  const [error, setError] = useState(false);
  // floating ui
  const { options, getReferenceProps, getFloatingProps } = useFloatingMenu({});
  const { context } = options;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLinkSubmit = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const url = input.value;
    if (!url) return;
    const { isValid, url: validatedUrl } = isValidHttpUrl(url);
    if (isValid) {
      setLinkEditor(editor, validatedUrl);
      context.onOpenChange(false);
      setError(false);
    } else {
      setError(true);
    }
  }, [editor, inputRef, context]);

  return (
    <FloatingMenuRoot
      classNames={{
        buttonContainer: "h-full",
      }}
      renderButton={(buttonProps) => (
        <ToolbarMenuTriggerButton {...buttonProps} size="sm" data-popup-open={context.open ? "" : undefined} />
      )}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
      menuButton={
        <span className={editor.isActive(CORE_EXTENSIONS.CUSTOM_LINK) ? "contents text-primary" : "contents"}>
          <ToolbarMenuTriggerLabel>Link</ToolbarMenuTriggerLabel>
          <Icon icon={LinkOutline} />
        </span>
      }
      options={options}
    >
      <PopoverPopup variant="rich" render={<section className="mt-1" />}>
        <InputGroup size="md">
          <Icon icon={LinkOutline} tint="secondary" />
          <Input
            size="md"
            ref={inputRef}
            type="url"
            aria-label="Link URL"
            aria-invalid={error || undefined}
            aria-describedby={error ? errorId : undefined}
            data-invalid={error ? "" : undefined}
            placeholder="Enter or paste a link"
            onClick={(e) => e.stopPropagation()}
            defaultValue={editor.getAttributes("link").href || ""}
            onKeyDown={(e) => {
              setError(false);
              if (e.key === "Enter") {
                e.preventDefault();
                handleLinkSubmit();
              }
            }}
            onFocus={() => setError(false)}
            autoFocus
          />
          {editor.getAttributes("link").href ? (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Remove link"
              showTooltip={false}
              icon={<Icon icon={DeleteOutline} tint="danger" />}
              onClick={(e) => {
                unsetLinkEditor(editor);
                e.stopPropagation();
                context.onOpenChange(false);
              }}
            />
          ) : (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Apply link"
              showTooltip={false}
              icon={<Icon icon={TickOutline} />}
              onClick={(e) => {
                e.stopPropagation();
                handleLinkSubmit();
              }}
            />
          )}
        </InputGroup>
        {error && (
          <p
            id={errorId}
            className="animate-in fade-in slide-in-from-top-0 pointer-events-none text-caption-sm-regular text-danger-primary"
          >
            Please enter a valid URL
          </p>
        )}
      </PopoverPopup>
    </FloatingMenuRoot>
  );
}
