/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
import { CheckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyIcon } from "@plane/propel/icons";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// plane utils
import { cn } from "@plane/utils";
// types
import type { TCodeBlockAttributes } from "./types";
import { ECodeBlockAttributeNames } from "./types";

// we just have ts support for now
const lowlight = createLowlight(common);
lowlight.register("ts", ts);

export function CodeBlockComponent(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props;
  const [copied, setCopied] = useState(false);
  // derived values
  const attrs = node.attrs as TCodeBlockAttributes;
  const currentLanguage = attrs[ECodeBlockAttributeNames.LANGUAGE] ?? "";

  // languages supported by the registered lowlight grammars
  const languageOptions = useMemo(() => {
    const options = lowlight.listLanguages().toSorted((a, b) => a.localeCompare(b));
    // keep an explicitly set but unregistered language selectable instead of blanking the picker
    if (currentLanguage && !options.includes(currentLanguage)) {
      options.push(currentLanguage);
    }
    return options;
  }, [currentLanguage]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    updateAttributes({ [ECodeBlockAttributeNames.LANGUAGE]: language === "" ? null : language });
  };

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper key={attrs[ECodeBlockAttributeNames.ID]} className="code-block group/code relative">
      {editor.isEditable && (
        <div
          contentEditable={false}
          role="presentation"
          className="absolute top-2 left-2 z-10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            aria-label="Code language"
            className="h-8 cursor-pointer rounded-md border border-subtle bg-layer-1 px-2 text-11 text-secondary backdrop-blur-sm outline-none hover:text-primary"
          >
            <option value="">Plain text</option>
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      )}
      <Tooltip tooltipContent="Copy code">
        <button
          type="button"
          className={cn(
            "group/button absolute top-2 right-2 z-10 hidden size-8 items-center justify-center rounded-md border border-subtle bg-layer-1 backdrop-blur-sm transition duration-150 ease-in-out group-hover/code:flex",
            {
              "bg-success-subtle hover:bg-success-subtle-1 active:bg-success-subtle-1": copied,
            }
          )}
          onClick={(e) => void copyToClipboard(e)}
        >
          {copied ? (
            <CheckIcon className="h-3 w-3 text-success-primary" strokeWidth={3} />
          ) : (
            <CopyIcon className="h-3 w-3 text-tertiary group-hover/button:text-primary" />
          )}
        </button>
      </Tooltip>

      <pre className={cn("my-2 rounded-lg bg-layer-3 p-4 text-primary", { "pt-10": editor.isEditable })}>
        <NodeViewContent as="code" className="whitespace-pre-wrap" />
      </pre>
    </NodeViewWrapper>
  );
}
