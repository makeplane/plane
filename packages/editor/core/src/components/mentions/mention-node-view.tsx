/* eslint-disable react/display-name */
// @ts-nocheck
import { NodeViewWrapper } from "@tiptap/react";
import { cn } from "src/lib/utils";
import { useRouter } from "next/router";
import { IMentionHighlight } from "src/types/mention-suggestion";
import { useEffect, useState } from "react";

// eslint-disable-next-line import/no-anonymous-default-export
export const MentionNodeView = (props) => {
  const router = useRouter();
  const [highlightsState, setHighlightsState] = useState<IMentionHighlight[]>();

  useEffect(() => {
    if (!props.extension.options.mentionHighlights) return;
    const hightlights = async () => {
      const userId = await props.extension.options.mentionHighlights();
      setHighlightsState(userId);
    };
    hightlights();
  }, [props.extension.options]);

  const handleClick = () => {
    if (!props.extension.options.readonly) {
      router.push(props.node.attrs.redirect_uri);
    }
  };

  return (
    <NodeViewWrapper className="mention-component inline w-fit">
      <span
        className={cn("mention rounded bg-custom-primary-100/20 px-1 py-0.5 font-medium text-custom-primary-100", {
          "bg-yellow-500/20 text-yellow-500": highlightsState
            ? highlightsState.includes(props.node.attrs.entity_identifier)
            : false,
          "cursor-pointer": !props.extension.options.readonly,
        })}
        onClick={handleClick}
      >
        @{props.node.attrs.label}
      </span>
    </NodeViewWrapper>
  );
};
