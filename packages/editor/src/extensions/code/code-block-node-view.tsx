/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
import { CopyOutline, TickOutline } from "@makeplane/propel/icons";
import { useState } from "react";
// ui
import { IconButton } from "@makeplane/propel/components/icon-button";
// types
import type { TCodeBlockAttributes } from "./types";
import { ECodeBlockAttributeNames } from "./types";

// we just have ts support for now
const lowlight = createLowlight(common);
lowlight.register("ts", ts);

type Props = {
  node: ProseMirrorNode;
};

export function CodeBlockComponent({ node }: Props) {
  const [copied, setCopied] = useState(false);
  // derived values
  const attrs = node.attrs as TCodeBlockAttributes;

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
      <div className="pointer-events-none absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within/code:pointer-events-auto group-focus-within/code:opacity-100 group-hover/code:pointer-events-auto group-hover/code:opacity-100">
        <IconButton
          aria-label={copied ? "Copied code" : "Copy code"}
          variant="secondary"
          size="lg"
          icon={copied ? <TickOutline className="text-success-primary" /> : <CopyOutline />}
          onClick={(e) => void copyToClipboard(e)}
        />
      </div>

      <pre className="my-2 rounded-lg bg-layer-3 p-4 text-primary">
        <NodeViewContent<"code"> as="code" className="whitespace-pre-wrap" />
      </pre>
    </NodeViewWrapper>
  );
}
