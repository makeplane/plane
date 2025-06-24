import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
// plane imports
import { cn } from "@plane/utils";

export const PiChatEditorMentionNodeView = (props) => {
  // TODO: move it to web app
  const [highlightsState, setHighlightsState] = useState<string[]>();

  useEffect(() => {
    if (!props.extension.options.mentionHighlights) return;
    const highlights = async () => {
      const userId = await props.extension.options.mentionHighlights();
      setHighlightsState(userId);
    };
    highlights();
  }, [props.extension.options]);

  return (
    <NodeViewWrapper className="mention-component inline w-fit">
      <a
        href={props.node.attrs.redirect_uri}
        target="_blank"
        className={cn("mention rounded px-1 py-0.5 font-medium bg-yellow-500/20 text-yellow-500 text-base", {
          "bg-yellow-500/20 text-yellow-500": highlightsState
            ? highlightsState.includes(props.node.attrs.entity_identifier)
            : false,
          "cursor-pointer": !props.extension.options.readonly,
        })}
      >
        @{props.node.attrs.target} {props.node.attrs.label}
      </a>
    </NodeViewWrapper>
  );
};
