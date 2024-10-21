import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ChevronRight } from "lucide-react";
// types
import { TToggleHeadingBlockAttributes } from "./types";
import { cn } from "@/helpers/common";

type Props = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TToggleHeadingBlockAttributes;
  };
};

export const CustomToggleHeadingBlock: React.FC<Props> = (props) => {
  const { node, updateAttributes } = props;
  // derived values
  const headingLevel = Number(node.attrs["data-heading-level"] ?? 1);
  const isToggleOpen = node.attrs["data-toggle-status"] === "open";

  return (
    <NodeViewWrapper className="editor-toggle-heading-component flex items-start gap-1 my-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateAttributes({
            "data-toggle-status": isToggleOpen ? "close" : "open",
          });
        }}
        className="flex-shrink-0 size-5 grid place-items-center rounded hover:bg-custom-background-80 transition-colors"
      >
        <ChevronRight
          className={cn("size-3.5 transition-all", {
            "rotate-90": isToggleOpen,
          })}
        />
      </button>
      <NodeViewContent as="div" className="w-full break-words" />
    </NodeViewWrapper>
  );
};
