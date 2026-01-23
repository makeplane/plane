import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
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
    <NodeViewWrapper key={attrs[ECodeBlockAttributeNames.ID]} className="code-block relative group/code">
      <Tooltip tooltipContent="Copy code">
        <button
          type="button"
          className={cn(
            "group/button hidden group-hover/code:flex items-center justify-center absolute top-2 right-2 z-10 size-8 rounded-md bg-layer-1 border border-subtle transition duration-150 ease-in-out backdrop-blur-sm",
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

      <pre className="bg-layer-3 text-primary rounded-lg p-4 my-2">
        <NodeViewContent as="code" className="whitespace-pre-wrap" />
      </pre>
    </NodeViewWrapper>
  );
}
