/* eslint-disable react/display-name */
// @ts-nocheck
import { NodeViewWrapper } from "@tiptap/react";
import { cn } from "src/lib/utils";
import { IMentionHighlight } from "src/types/mention-suggestion";
import { useEffect, useState } from "react";

// eslint-disable-next-line import/no-anonymous-default-export
export const MentionNodeView = (props) => {
  // TODO: move it to web app
  const [highlightsState, setHighlightsState] = useState<IMentionHighlight[]>();

  useEffect(() => {
    if (!props.extension.options.mentionHighlights) return;
    const hightlights = async () => {
      const userId = await props.extension.options.mentionHighlights();
      setHighlightsState(userId);
    };
    hightlights();
  }, [props.extension.options]);

  return (
    <NodeViewWrapper className="mention-component inline w-fit">
      <a
        href={props.node.attrs.redirect_uri}
        target="_blank"
        className={cn("mention rounded bg-custom-primary-100/20 px-1 py-0.5 font-medium text-custom-primary-100", {
          "bg-yellow-500/20 text-yellow-500": highlightsState
            ? highlightsState.includes(props.node.attrs.entity_identifier)
            : false,
          "cursor-pointer": !props.extension.options.readonly,
        })}
      >
        @{props.node.attrs.label}
      </a>
    </NodeViewWrapper>
  );
};
