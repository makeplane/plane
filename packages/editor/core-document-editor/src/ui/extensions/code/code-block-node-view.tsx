import { useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import ts from "highlight.js/lib/languages/typescript";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

// we just have ts support for now
const lowlight = createLowlight(common);
lowlight.register("ts", ts);

interface CodeBlockComponentProps {
  node: ProseMirrorNode;
}

export const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({ node }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper className="code-block relative">
      <button
        className="group absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-md bg-custom-background-100
        hover:bg-custom-background-90 focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-custom-border-200 active:bg-custom-background-90 transition duration-150 ease-in-out"
        type="button"
        onClick={copyToClipboard}
      >
        {copied ? (
          <CheckIcon className="h-3 w-3 text-green-500" />
        ) : (
          <CopyIcon className="h-3 w-3 text-custom-text-300 group-hover:text-custom-text-100" />
        )}
      </button>

      <pre className="bg-custom-background-80 text-custom-text-100 rounded-lg p-8 pl-9 pr-4">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};
