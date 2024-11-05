import { useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn, PiChatEditor } from "@plane/editor";
import { useUser } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { FocusFilter } from "./focus-filter";

type TEditCommands = {
  getHTML: () => string;
  clear: () => void;
};
type TProps = {
  isFullScreen: boolean;
};
export const InputBox = (props: TProps) => {
  const { isFullScreen } = props;
  // store hooks
  const { getAnswer, searchCallback, isPiTyping } = usePiChat();
  const { data: currentUser } = useUser();
  const { workspaceSlug } = useParams();
  // states
  const editorCommands = useRef<TEditCommands | null>(null);
  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (!currentUser) return;
      e?.preventDefault();
      const query = editorCommands.current?.getHTML();
      if (!query) return;
      getAnswer(query, currentUser?.id);
      editorCommands.current?.clear();
    },
    [currentUser, editorCommands, getAnswer]
  );

  return (
    <form
      className={cn(
        "flex flex-col absolute bottom-3 inset-x-10 bg-pi-50 left-1/2 transform -translate-x-1/2 max-w-[800px] w-[90%] px-2 md:px-0",
        {
          "md:w-[70%]": isFullScreen,
        }
      )}
    >
      <div className="bg-custom-background-100 w-full rounded-[28px] p-2 flex gap-3 shadow-sm border-[4px] border-pi-100">
        {/* Focus */}
        <FocusFilter />
        {/* Input Box */}
        <PiChatEditor
          setEditorCommand={(command) => {
            setEditorCommands({ ...command });
          }}
          handleSubmit={handleSubmit}
          mentionSuggestions={async (query: string) => searchCallback(workspaceSlug.toString(), query)}
        />
        {/* Submit button */}
        <button
          className={cn("border p-2 my-auto mb-0 rounded-full bg-gradient-to-b from-pi-500 to-pi-600 text-white", {
            "from-pi-100 to-pi-300 text-pi-400 cursor-not-allowed": isPiTyping,
          })}
          type="submit"
          onClick={handleSubmit}
          disabled={isPiTyping}
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <div className="text-xs text-custom-text-350 mt-2 text-center">
        Pi can make mistakes, please double-check responses.
      </div>
    </form>
  );
};
