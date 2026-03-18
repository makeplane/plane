/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useRef, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { cn, createSyntaxHighlightPattern, WORD_AFTER_OPERATOR_PATTERN, INSIDE_BRACKETS_PATTERN } from "@plane/utils";
import type { CustomProperty, CustomPropertyType } from "@plane/types";
// local imports
import { FieldReferencePicker } from "./field-reference-picker";

type TFormulaInputProps = {
  value: string;
  onChange: (value: string) => void;
  properties: CustomProperty<CustomPropertyType>[];
  currentPropertyId?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const FormulaInput = observer(function FormulaInput(props: TFormulaInputProps) {
  const { value, onChange, properties, currentPropertyId, error, placeholder, disabled } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Render formula with syntax highlighting - now using {Display Name} format
  const highlightedFormula = useMemo(() => {
    if (!value) return null;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    // Match field references {Display Name} and string literals "text"
    const tokenRegex = createSyntaxHighlightPattern();
    let match;
    let key = 0;

    while ((match = tokenRegex.exec(value)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(<span key={`text-${key++}`}>{value.substring(lastIndex, match.index)}</span>);
      }

      // Add the matched token with appropriate styling
      const token = match[0];

      if (token.startsWith("{")) {
        // Field reference - style entire token including braces
        // No padding/border to maintain exact character width for cursor alignment
        elements.push(
          <span key={`field-${key++}`} className="bg-danger-subtle text-danger-primary font-medium">
            {token}
          </span>
        );
      } else if (token.startsWith('"') || token.startsWith("'")) {
        // String literal (double or single quotes) - blue text
        elements.push(
          <span key={`string-${key++}`} className="text-blue-600">
            {token}
          </span>
        );
      }

      lastIndex = match.index + token.length;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      elements.push(<span key={`text-${key++}`}>{value.substring(lastIndex)}</span>);
    }

    return elements;
  }, [value]); // No dependency on properties - just value

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Hide picker on Escape
    if (e.key === "Escape" && showFieldPicker) {
      e.preventDefault();
      setShowFieldPicker(false);
      setSearchQuery("");
    }
  };

  // Handle input changes to track autocomplete search
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);

    // Check if we're typing inside existing brackets
    const insideBrackets = textBeforeCursor.match(INSIDE_BRACKETS_PATTERN);

    if (insideBrackets) {
      // Don't show autocomplete when editing inside existing field reference
      setShowFieldPicker(false);
      setSearchQuery("");
      return;
    }

    // Check if we're typing a potential field name
    // Look for word characters after space, operator, or start of line
    const wordMatch = textBeforeCursor.match(WORD_AFTER_OPERATOR_PATTERN);

    if (wordMatch && wordMatch[1].length >= 2) {
      // User typed at least 2 chars - show autocomplete
      const query = wordMatch[1].trim();
      setSearchQuery(query);
      setShowFieldPicker(true);
    } else {
      // Not enough characters or not a word pattern - close picker
      setShowFieldPicker(false);
      setSearchQuery("");
    }
  };

  const handleFieldSelect = useCallback(
    (property: CustomProperty<CustomPropertyType>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, start);

      // Find the word we're completing
      const wordMatch = textBeforeCursor.match(WORD_AFTER_OPERATOR_PATTERN);

      if (wordMatch) {
        const wordStart = start - wordMatch[1].length;
        const textAfterCursor = value.substring(start);

        // Insert field with braces
        const fieldReference = `{${property.display_name}}`;
        const newValue = value.substring(0, wordStart) + fieldReference + textAfterCursor;

        onChange(newValue);

        // Position cursor after the field
        const newCursorPos = wordStart + fieldReference.length;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }

      setShowFieldPicker(false);
      setSearchQuery("");
    },
    [value, onChange]
  );

  const handleClosePicker = useCallback(() => {
    setShowFieldPicker(false);
    setSearchQuery("");
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input container with syntax highlighting overlay */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Formula input"
          aria-invalid={!!error}
          aria-describedby={error ? "formula-error" : undefined}
          style={{ caretColor: "#3b82f6" }}
          className={cn(
            // Base styles from @plane/ui TextArea
            "no-scrollbar w-full bg-layer-2 outline-none",
            // Mode: primary - border styles
            "rounded-md border-[0.5px] border-subtle-1",
            // Size: sm - padding
            "px-3 py-2",
            // Custom styles for syntax highlighting
            "font-mono text-13 text-transparent min-h-20 resize-none",
            // Error state from @plane/ui
            error && "border-danger-strong bg-danger-subtle"
          )}
        />

        {/* Syntax highlight overlay - only show when there's content */}
        {highlightedFormula && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none font-mono px-3 py-2 text-13 whitespace-pre-wrap wrap-break-word overflow-hidden"
          >
            {highlightedFormula}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div id="formula-error" className="mt-1 text-caption-sm-regular text-danger-primary">
          {error}
        </div>
      )}

      {/* Field reference picker dropdown */}
      {showFieldPicker && !disabled && (
        <FieldReferencePicker
          properties={properties}
          currentPropertyId={currentPropertyId}
          onSelect={handleFieldSelect}
          onClose={handleClosePicker}
          initialSearchQuery={searchQuery}
        />
      )}
    </div>
  );
});
