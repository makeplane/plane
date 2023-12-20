/* eslint-disable react/display-name */
// @ts-nocheck
import { NodeViewWrapper } from "@tiptap/react";
import { cn } from "src/lib/utils";
import { useRouter } from "next/router";
import { IMentionHighlight } from "src/types/mention-suggestion";

// eslint-disable-next-line import/no-anonymous-default-export
export const MentionNodeView = (props) => {
  const router = useRouter();
  const highlights = props.extension.options.mentionHighlights as IMentionHighlight[];

  const handleClick = () => {
    if (!props.extension.options.readonly) {
      router.push(props.node.attrs.redirect_uri);
    }
  };

  return (
    <NodeViewWrapper className="mention-component inline w-fit">
      <span
        className={cn("mention rounded bg-custom-primary-100/20 px-1 py-0.5 font-medium text-custom-primary-100", {
          "bg-yellow-500/20 text-yellow-500": highlights ? highlights.includes(props.node.attrs.id) : false,
          "cursor-pointer": !props.extension.options.readonly,
          // "hover:bg-custom-primary-300" : !props.extension.options.readonly && !highlights.includes(props.node.attrs.id)
        })}
        onClick={handleClick}
        data-mention-target={props.node.attrs.target}
        data-mention-id={props.node.attrs.id}
      >
        @{props.node.attrs.label}
      </span>
    </NodeViewWrapper>
  );
};
