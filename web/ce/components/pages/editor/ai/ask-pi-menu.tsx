import { useState } from "react";
import { CircleArrowUp, CornerDownRight, RefreshCcw, Sparkles } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// components
import { RichTextReadOnlyEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  handleInsertText: (insertOnNextLine: boolean) => void;
  handleRegenerate: () => Promise<void>;
  isRegenerating: boolean;
  response: string | undefined;
};

export const AskPiMenu: React.FC<Props> = (props) => {
  const { handleInsertText, handleRegenerate, isRegenerating, response } = props;
  // states
  const [query, setQuery] = useState("");

  return (
    <>
      <div
        className={cn("flex items-center gap-3 px-4 py-3.5", {
          "items-start": response,
        })}
      >
        <span className="flex-shrink-0 size-7 grid place-items-center text-custom-text-200 rounded-full border border-custom-border-200">
          <Sparkles className="size-3" />
        </span>
        {response ? (
          <div>
            <RichTextReadOnlyEditor
              displayConfig={{
                fontSize: "small-font",
              }}
              id="editor-ai-response"
              initialValue={response}
              containerClassName="!p-0 border-none"
              editorClassName="!pl-0"
            />
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                className="p-1 text-custom-text-300 text-sm font-medium rounded hover:bg-custom-background-80 outline-none"
                onClick={() => handleInsertText(false)}
              >
                Replace selection
              </button>
              <Tooltip tooltipContent="Add to next line">
                <button
                  type="button"
                  className="flex-shrink-0 size-6 grid place-items-center rounded hover:bg-custom-background-80 outline-none"
                  onClick={() => handleInsertText(true)}
                >
                  <CornerDownRight className="text-custom-text-300 size-4" />
                </button>
              </Tooltip>
              <Tooltip tooltipContent="Re-generate response">
                <button
                  type="button"
                  className="flex-shrink-0 size-6 grid place-items-center rounded hover:bg-custom-background-80 outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRegenerate();
                  }}
                  disabled={isRegenerating}
                >
                  <RefreshCcw
                    className={cn("text-custom-text-300 size-4", {
                      "animate-spin": isRegenerating,
                    })}
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <p className="text-sm text-custom-text-200">Pi is answering...</p>
        )}
      </div>
      <div className="py-3 px-4">
        <div className="flex items-center gap-2 border border-custom-border-200 rounded-md p-2">
          <span className="flex-shrink-0 size-3 grid place-items-center">
            <Sparkles className="size-3 text-custom-text-200" />
          </span>
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none placeholder:text-custom-text-400 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tell Pi what to do..."
          />
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <CircleArrowUp className="size-4 text-custom-text-200" />
          </span>
        </div>
      </div>
    </>
  );
};
