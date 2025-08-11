import { useRef, useState } from "react";
// plane imports
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
// plane constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { TMathModalBaseProps } from "../types";
// utils
import { validateLaTeX } from "../utils/latex-validator";

type TMathModalProps = TMathModalBaseProps & {
  onPreview?: (latex: string, isValid: boolean, errorMessage?: string) => void;
};

export const MathInputModal = ({ latex, onSave, onClose, onPreview, nodeType }: TMathModalProps) => {
  // refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // states
  const [isValidLatex, setIsValidLatex] = useState(true);
  const [currentValue, setCurrentValue] = useState(latex);

  // Validate and render LaTeX preview
  const validateAndRenderLatex = (latexValue: string) => {
    if (!latexValue.trim()) {
      setIsValidLatex(true);
      onPreview?.(latexValue, true);
      return;
    }

    // Use optimized validation utility
    const validation = validateLaTeX(latexValue, {
      displayMode: nodeType === ADDITIONAL_EXTENSIONS.BLOCK_MATH,
    });

    setIsValidLatex(validation.isValid);
    onPreview?.(latexValue, validation.isValid, validation.errorMessage);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentValue(value);
    validateAndRenderLatex(value);
  };

  const handleSave = () => {
    const value = currentValue.trim();
    onSave(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleSave();
      onClose();
    }
  };

  return (
    <div
      className="bg-custom-background-100 border border-custom-border-200 rounded-lg p-4 mt-2 shadow-2xl min-w-[400px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <textarea
          ref={inputRef}
          className={cn(
            "w-full px-0 py-0 bg-transparent border-none text-sm font-mono text-custom-text-100 placeholder-custom-text-300 focus:outline-none resize-none",
            nodeType === ADDITIONAL_EXTENSIONS.INLINE_MATH ? "min-h-[32px]" : "min-h-[120px]"
          )}
          placeholder={ADDITIONAL_EXTENSIONS.INLINE_MATH === nodeType ? "F = ma" : "F = G \\frac{m_1 m_2}{r^2}"}
          value={currentValue}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          rows={6}
          autoFocus
          onFocus={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Set cursor to end of content when focused
            const target = e.target;
            const length = target.value.length;
            target.setSelectionRange(length, length);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </div>

      {/* Footer with error message and button */}
      <div className="flex justify-between items-center pt-2">
        <div>
          {!isValidLatex ? (
            <div className="text-red-400 flex items-center gap-1">
              <span className="text-base shrink-0"> ⚠ </span>
              <span className="text-xs"> Invalid syntax</span>
            </div>
          ) : null}
        </div>
        <Button onClick={handleSave} size="sm" disabled={!isValidLatex} variant="primary">
          Done
        </Button>
      </div>
    </div>
  );
};
