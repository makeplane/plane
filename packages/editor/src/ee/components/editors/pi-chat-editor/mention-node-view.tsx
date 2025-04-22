// TODO: fix all warnings

/* eslint-disable react/display-name */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
// plane utils
import { cn } from "@plane/utils";

// eslint-disable-next-line import/no-anonymous-default-export
export const PiMentionNodeView = (props) => {
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
