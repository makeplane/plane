import { useState } from "react";
import { CircleArrowUp, CornerDownRight, RefreshCcw, Sparkles } from "lucide-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// components
import { cn } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
// helpers
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  handleInsertText: (insertOnNextLine: boolean) => void;
  handleRegenerate: () => Promise<void>;
  isRegenerating: boolean;
  response: string | undefined;
  workspaceSlug: string;
};

export function AskPiMenu(props: Props) {
  const { handleInsertText, handleRegenerate, isRegenerating, response, workspaceSlug } = props;
  // states
  const [query, setQuery] = useState("");
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";

  return (
    <>
      <div
        className={cn("flex items-center gap-3 px-4 py-3.5", {
          "items-start": response,
        })}
      >
        <span className="flex-shrink-0 size-7 grid place-items-center text-secondary rounded-full border border-subtle">
          <Sparkles className="size-3" />
        </span>
        {response ? (
          <div>
            <RichTextEditor
              editable={false}
              displayConfig={{
                fontSize: "small-font",
              }}
              id="editor-ai-response"
              initialValue={response}
              containerClassName="!p-0 border-none"
              editorClassName="!pl-0"
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
            />
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                className="p-1 text-tertiary text-13 font-medium rounded-sm hover:bg-layer-1 outline-none"
                onClick={() => handleInsertText(false)}
              >
                Replace selection
              </button>
              <Tooltip tooltipContent="Add to next line">
                <button
                  type="button"
                  className="flex-shrink-0 size-6 grid place-items-center rounded-sm hover:bg-layer-1 outline-none"
                  onClick={() => handleInsertText(true)}
                >
                  <CornerDownRight className="text-tertiary size-4" />
                </button>
              </Tooltip>
              <Tooltip tooltipContent="Re-generate response">
                <button
                  type="button"
                  className="flex-shrink-0 size-6 grid place-items-center rounded-sm hover:bg-layer-1 outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRegenerate();
                  }}
                  disabled={isRegenerating}
                >
                  <RefreshCcw
                    className={cn("text-tertiary size-4", {
                      "animate-spin": isRegenerating,
                    })}
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <p className="text-13 text-secondary">AI is answering...</p>
        )}
      </div>
      <div className="py-3 px-4">
        <div className="flex items-center gap-2 border border-subtle rounded-md p-2">
          <span className="flex-shrink-0 size-3 grid place-items-center">
            <Sparkles className="size-3 text-secondary" />
          </span>
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none placeholder:text-placeholder text-13"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tell AI what to do..."
          />
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <CircleArrowUp className="size-4 text-secondary" />
          </span>
        </div>
      </div>
    </>
  );
}
