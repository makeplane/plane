import { useState } from "react";
import Markdown from "react-markdown";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@plane/utils";
import { Thinking } from "./thinking";

type TProps = {
  reasoning: string | undefined;
  isReasoning: boolean;
};

export const ReasoningBlock = (props: TProps) => {
  const { reasoning, isReasoning } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-fit hover:bg-custom-background-90 rounded-full px-4 py-2 transition-all duration-500 ease-in-out border border-custom-border-200 hover:border-transparent"
      >
        <div className="flex gap-2 items-center">
          {isReasoning ? (
            <Thinking />
          ) : (
            <div className="text-base text-custom-text-200 font-medium">{isOpen ? "Hide" : "Show"} thinking</div>
          )}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-500 ease-in-out ${isOpen ? "transform rotate-180" : ""}`}
          />
        </div>
      </button>

      {reasoning && (
        <div
          className={cn(
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",

            isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 mt-0"
          )}
        >
          <div className="pl-4 ml-4 overflow-hidden border-l border-custom-border-200 text-custom-text-300">
            <Markdown className="pi-chat-root text-sm">{reasoning}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
};
