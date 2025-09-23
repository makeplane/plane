import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { ECommentAttributeNames } from "../types";

type CommentInteractionState = {
  hovered: Set<string>;
  selected: string | null;
  decorations: DecorationSet;
};

type CommentInteractionMeta = {
  hovered?: string[];
  selected?: string | null;
};

export const commentInteractionPluginKey = new PluginKey<CommentInteractionState>("commentInteraction");

const buildDecorations = (
  doc: Parameters<typeof DecorationSet.create>[0],
  hovered: Set<string>,
  selected: string | null
) => {
  if (hovered.size === 0 && !selected) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];
  const hoverClassNames = ["bg-[#FFBF66]/40", "transition-all", "duration-200"];
  const selectedClassNames = ["scale-[1.02]", "transition-all", "duration-300"];

  doc.descendants((node, pos) => {
    if (!node.isText) {
      return true;
    }

    node.marks.forEach((mark) => {
      if (mark.type.name !== ADDITIONAL_EXTENSIONS.COMMENTS) {
        return;
      }

      const commentId = mark.attrs[ECommentAttributeNames.COMMENT_ID];
      if (typeof commentId !== "string" || commentId.length === 0) {
        return;
      }

      const isHovered = hovered.has(commentId);
      const isSelected = selected === commentId;

      if (!isHovered && !isSelected) {
        return;
      }

      const classNames: string[] = [];
      if (isHovered) {
        classNames.push(...hoverClassNames);
      }
      if (isSelected) {
        classNames.push(...selectedClassNames);
      }

      const decorationAttrs: Record<string, string> = {
        "data-comment-highlighted": "true",
      };
      if (isHovered) {
        decorationAttrs["data-comment-highlight-state"] = isSelected ? "hovered-selected" : "hovered";
      }
      if (isSelected && !isHovered) {
        decorationAttrs["data-comment-highlight-state"] = "selected";
      }
      if (classNames.length > 0) {
        decorationAttrs.class = classNames.join(" ");
      }

      decorations.push(
        Decoration.inline(pos, pos + node.nodeSize, decorationAttrs, {
          inclusiveStart: true,
          inclusiveEnd: true,
        })
      );
    });

    return true;
  });

  return DecorationSet.create(doc, decorations);
};

export const createCommentHighlightPlugin = () =>
  new Plugin<CommentInteractionState>({
    key: commentInteractionPluginKey,
    state: {
      init: () => ({
        hovered: new Set<string>(),
        selected: null,
        decorations: DecorationSet.empty,
      }),
      apply: (tr, value, _oldState, newState) => {
        let hovered = value.hovered;
        let selected = value.selected;
        let decorations = value.decorations;

        const meta = tr.getMeta(commentInteractionPluginKey) as CommentInteractionMeta | undefined;
        let shouldRecalculate = tr.docChanged;

        if (meta) {
          if (meta.hovered) {
            hovered = new Set(meta.hovered.filter((id) => typeof id === "string" && id.length > 0));
            shouldRecalculate = true;
          }
          if (meta.selected !== undefined) {
            selected = typeof meta.selected === "string" && meta.selected.length > 0 ? meta.selected : null;
            shouldRecalculate = true;
          }
        }

        if (shouldRecalculate) {
          decorations = buildDecorations(newState.doc, hovered, selected);
        } else if (tr.docChanged) {
          decorations = decorations.map(tr.mapping, newState.doc);
        }

        return {
          hovered,
          selected,
          decorations,
        };
      },
    },
    props: {
      decorations(state) {
        return commentInteractionPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
