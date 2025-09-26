import type { Mark, MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// local imports
import { ADDITIONAL_EXTENSIONS } from "../../../constants/extensions";
import { COMMENT_MARK_SELECTORS, ECommentAttributeNames, type TCommentClickPayload } from "../types";

export type TClickHandlerPluginOptions = {
  onCommentClick?: (payload: TCommentClickPayload) => void;
  isTouchDevice?: boolean;
};

export const createClickHandlerPlugin = (options: TClickHandlerPluginOptions) => {
  const { onCommentClick, isTouchDevice } = options;

  return new Plugin({
    key: new PluginKey("commentClickHandler"),
    props: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          const target = event.target as HTMLElement;
          if (!(target instanceof Element)) {
            return false;
          }
          const commentMark = target.closest(COMMENT_MARK_SELECTORS.WITH_ID);
          const commentId = commentMark?.getAttribute(ECommentAttributeNames.COMMENT_ID);
          const isCommentResolved = commentMark?.getAttribute(ECommentAttributeNames.RESOLVED) === "true";

          if (commentMark && commentId && !isCommentResolved) {
            if (isTouchDevice) {
              event.preventDefault();
              event.stopPropagation();
            }

            const commentIds = new Set<string>([commentId]);

            const domRange = getDomRangePositions(view, commentMark);
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });

            const markRange = findCommentBounds(view, commentId);

            if (markRange) {
              addCommentIdsFromRange(commentIds, view, markRange.from, markRange.to);
            }

            if (domRange) {
              addCommentIdsFromRange(commentIds, view, domRange.from, domRange.to);
              addCommentIdsAtPosition(commentIds, view, domRange.from);
              addCommentIdsAtPosition(commentIds, view, domRange.to);
            }

            addCommentIdsAtPosition(commentIds, view, coords?.pos);

            const referenceParagraph = commentMark.closest("p")?.outerHTML ?? "<p></p>";
            const payload: TCommentClickPayload = {
              referenceParagraph,
              primaryCommentId: commentId,
              commentIds: Array.from(commentIds),
            };

            onCommentClick?.(payload);
            return false;
          }

          return false;
        },
      },
    },
  });
};

function getCommentMarkType(view: EditorView): MarkType | undefined {
  return view.state.schema.marks[ADDITIONAL_EXTENSIONS.COMMENTS] as MarkType | undefined;
}

function isResolvedAttr(value: unknown): boolean {
  return typeof value === "string" ? value === "true" : Boolean(value);
}

function isCommentMark(mark: Mark, commentMarkType: MarkType): boolean {
  return mark.type === commentMarkType;
}

function collectCommentIdsInRange(view: EditorView, from: number, to: number): string[] {
  const commentMarkType = getCommentMarkType(view);

  if (!commentMarkType) {
    return [] as string[];
  }

  const { doc } = view.state;
  const docSize = doc.content.size;

  let start = Math.max(0, Math.min(from, docSize));
  let end = Math.max(0, Math.min(to, docSize));

  if (start > end) {
    [start, end] = [end, start];
  }

  if (start === end) {
    if (end < docSize) {
      end = Math.min(docSize, end + 1);
    } else if (start > 0) {
      start = Math.max(0, start - 1);
    }
  }

  if (start === end) {
    return [] as string[];
  }

  const ids = new Set<string>();

  const addMarks = (marks?: readonly Mark[]) => {
    marks?.forEach((mark) => {
      if (!isCommentMark(mark, commentMarkType)) {
        return;
      }

      const commentId = mark.attrs[ECommentAttributeNames.COMMENT_ID];
      const resolvedValue = mark.attrs[ECommentAttributeNames.RESOLVED];

      if (typeof commentId !== "string" || commentId.length === 0 || isResolvedAttr(resolvedValue)) {
        return;
      }

      ids.add(commentId);
    });
  };

  doc.nodesBetween(start, end, (node) => {
    addMarks(node.marks);
  });

  return Array.from(ids);
}

function findCommentBounds(view: EditorView, commentId: string): { from: number; to: number } | null {
  const commentMarkType = getCommentMarkType(view);

  if (!commentMarkType) {
    return null;
  }

  let from: number | null = null;
  let to: number | null = null;

  view.state.doc.descendants((node, pos) => {
    if (!node.isText) {
      return;
    }

    node.marks.forEach((mark) => {
      if (!isCommentMark(mark, commentMarkType)) {
        return;
      }

      const markCommentId = mark.attrs[ECommentAttributeNames.COMMENT_ID];
      const resolvedValue = mark.attrs[ECommentAttributeNames.RESOLVED];

      if (markCommentId !== commentId || isResolvedAttr(resolvedValue)) {
        return;
      }

      const nodeEnd = pos + node.nodeSize;

      from = from === null ? pos : Math.min(from, pos);
      to = to === null ? nodeEnd : Math.max(to, nodeEnd);
    });
  });

  if (from === null || to === null || from === to) {
    return null;
  }

  return { from, to };
}

function getDomRangePositions(view: EditorView, element: Element): { from: number; to: number } | null {
  try {
    const from = view.posAtDOM(element, 0);
    const to = view.posAtDOM(element, element.childNodes.length);

    return { from, to };
  } catch (_error) {
    return null;
  }
}

function addCommentIdsFromRange(commentIds: Set<string>, view: EditorView, from?: number | null, to?: number | null) {
  if (typeof from !== "number" || typeof to !== "number") {
    return;
  }

  collectCommentIdsInRange(view, from, to).forEach((id) => commentIds.add(id));
}

function addCommentIdsAtPosition(commentIds: Set<string>, view: EditorView, position?: number | null) {
  if (typeof position !== "number") {
    return;
  }

  addCommentIdsFromRange(commentIds, view, position, position);
}
