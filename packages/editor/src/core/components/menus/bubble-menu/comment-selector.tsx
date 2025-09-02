import { Editor } from "@tiptap/core";
import { MessageSquare } from "lucide-react";
import { Dispatch, FC, SetStateAction, useCallback } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";

type Props = {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onStartNewComment?: (selection?: { from: number; to: number; referenceText?: string }) => void;
};

export const BubbleMenuCommentSelector: FC<Props> = (props) => {
  const { editor, isOpen, setIsOpen, onStartNewComment } = props;

  const handleCommentCreate = useCallback(() => {
    // Get current selection
    const { selection } = editor.state;
    if (selection.empty) return;

    const { from, to } = selection;

    // Extract the selected text as reference
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    // Call the callback to start a new comment with reference text
    if (onStartNewComment) {
      onStartNewComment({ from, to, referenceText: selectedText });
    }

    setIsOpen(false);
  }, [editor, setIsOpen, onStartNewComment]);

  return (
    <div className="relative h-full">
      <button
        type="button"
        className={cn(
          "h-full flex items-center gap-1 px-3 text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 rounded transition-colors",
          {
            "bg-custom-background-80": isOpen,
            "text-custom-text-100": editor.isActive(ADDITIONAL_EXTENSIONS.COMMENTS),
          }
        )}
        onClick={(e) => {
          handleCommentCreate();
          e.stopPropagation();
        }}
      >
        Comment
        <MessageSquare className="flex-shrink-0 size-3" />
      </button>
    </div>
  );
};
