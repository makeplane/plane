import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui-components/react/combobox";
import { SearchIcon } from "../icons";
import { cn } from "../utils/classname";

// Type definitions
type TMaxHeight = "lg" | "md" | "rg" | "sm";

export interface ComboboxProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface ComboboxButtonProps {
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export interface ComboboxOptionsProps {
  searchPlaceholder?: string;
  emptyMessage?: string;
  showSearch?: boolean;
  className?: string;
  children?: React.ReactNode;
  maxHeight?: TMaxHeight;
  inputClassName?: string;
  optionsContainerClassName?: string;
  positionerClassName?: string;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearchQueryKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dataPreventOutsideClick?: boolean;
}

export interface ComboboxOptionProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Constants
const MAX_HEIGHT_CLASSES: Record<TMaxHeight, string> = {
  lg: "max-h-60",
  md: "max-h-48",
  rg: "max-h-36",
  sm: "max-h-28",
} as const;

// Root component
function ComboboxRoot({
  value,
  defaultValue,
  onValueChange,
  multiSelect = false,
  disabled = false,
  open,
  onOpenChange,
  children,
}: ComboboxProps) {
  const handleValueChange = React.useCallback(
    (newValue: string | string[]) => {
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  return (
    <BaseCombobox.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={handleValueChange}
      multiple={multiSelect}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseCombobox.Root>
  );
}

// Trigger button component
const ComboboxButton = React.forwardRef(function ComboboxButton(
  { className, children, disabled = false }: ComboboxButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <BaseCombobox.Trigger ref={ref} disabled={disabled} className={className}>
      {children}
    </BaseCombobox.Trigger>
  );
});

// Options popup component
function ComboboxOptions({
  children,
  showSearch = false,
  searchPlaceholder,
  maxHeight = "lg",
  className,
  inputClassName,
  optionsContainerClassName,
  emptyMessage = "No results found",
  positionerClassName,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
  onSearchQueryKeyDown,
  dataPreventOutsideClick,
}: ComboboxOptionsProps) {
  // const [searchQuery, setSearchQuery] = React.useState("");
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("");

  const searchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearchQuery;

  const setSearchQuery = React.useCallback(
    (query: string) => {
      if (onSearchQueryChange) {
        onSearchQueryChange(query);
      } else {
        setInternalSearchQuery(query);
      }
    },
    [onSearchQueryChange]
  );

  // Filter children based on search query
  const filteredChildren = React.useMemo(() => {
    if (!showSearch || !searchQuery) return children;

    return React.Children.toArray(children).filter((child) => {
      if (!React.isValidElement(child)) return true;

      // Only filter ComboboxOption components, leave other elements (like additional content) unfiltered
      if (child.type !== ComboboxOption) return true;

      // Extract text content from child to search against
      const getTextContent = (node: React.ReactNode): string => {
        if (typeof node === "string") return node;
        if (typeof node === "number") return String(node);
        if (React.isValidElement(node) && node.props.children) {
          return getTextContent(node.props.children);
        }
        if (Array.isArray(node)) {
          return node.map(getTextContent).join(" ");
        }
        return "";
      };

      const textContent = getTextContent(child.props.children);
      const value = child.props.value || "";

      const searchLower = searchQuery.toLowerCase();
      return textContent.toLowerCase().includes(searchLower) || String(value).toLowerCase().includes(searchLower);
    });
  }, [children, searchQuery, showSearch]);

  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner sideOffset={8} className={positionerClassName}>
        <BaseCombobox.Popup
          className={cn("rounded-md border border-subtle bg-surface-1 p-1 shadow-lg", className)}
          data-prevent-outside-click={dataPreventOutsideClick}
        >
          <div className="flex flex-col gap-1">
            {showSearch && (
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={onSearchQueryKeyDown}
                  className={cn(
                    "w-full rounded-sm border border-subtle bg-surface-2 py-1.5 pl-8 pr-2 text-13 outline-none placeholder:text-placeholder",
                    inputClassName
                  )}
                />
              </div>
            )}
            <BaseCombobox.List
              className={cn("overflow-auto outline-none", MAX_HEIGHT_CLASSES[maxHeight], optionsContainerClassName)}
            >
              {filteredChildren}
              {showSearch &&
                emptyMessage &&
                React.Children.count(
                  React.Children.toArray(filteredChildren).filter(
                    (child) => React.isValidElement(child) && child.type === ComboboxOption
                  )
                ) === 0 && <div className="px-2 py-1.5 text-13 text-placeholder">{emptyMessage}</div>}
            </BaseCombobox.List>
          </div>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

// Individual option component
function ComboboxOption({ value, children, disabled, className }: ComboboxOptionProps) {
  return (
    <BaseCombobox.Item
      value={value}
      disabled={disabled}
      className={cn("cursor-pointer rounded-sm px-2 py-1.5 text-13 outline-none transition-colors", className)}
    >
      {children}
    </BaseCombobox.Item>
  );
}

// Compound component export
const Combobox = Object.assign(ComboboxRoot, {
  Button: ComboboxButton,
  Options: ComboboxOptions,
  Option: ComboboxOption,
});

export { Combobox };
