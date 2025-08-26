import * as React from "react";
import { cn } from "@plane/utils";
import { Command } from "../command/command";
import { Popover } from "../popover/root";

export interface ComboboxOption {
  value: unknown;
  query: string;
  content: React.ReactNode;
  disabled?: boolean;
  tooltip?: string | React.ReactNode;
}

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
}

export interface ComboboxOptionsProps {
  searchPlaceholder?: string;
  emptyMessage?: string;
  showSearch?: boolean;
  showCheckIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
  maxHeight?: "lg" | "md" | "rg" | "sm";
  inputClassName?: string;
  optionsContainerClassName?: string;
}

export interface ComboboxOptionProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Context for sharing state between components
interface ComboboxContextType {
  value: string | string[];
  onValueChange?: (value: string | string[]) => void;
  multiSelect: boolean;
  maxSelections?: number;
  disabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleValueChange: (newValue: string) => void;
  handleRemoveSelection: (valueToRemove: string) => void;
}

const ComboboxContext = React.createContext<ComboboxContextType | null>(null);

function useComboboxContext() {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a Combobox");
  }
  return context;
}

function ComboboxComponent({
  value,
  defaultValue,
  onValueChange,
  multiSelect = false,
  maxSelections,
  disabled = false,
  open: openProp,
  onOpenChange,
  children,
}: ComboboxProps) {
  // Controlled/uncontrolled value
  const isControlledValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    (isControlledValue ? (value as string | string[]) : defaultValue) ?? (multiSelect ? [] : "")
  );

  // Controlled/uncontrolled open state
  const isControlledOpen = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlledOpen ? (openProp as boolean) : internalOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlledOpen, onOpenChange]
  );

  // Update internal value when prop changes
  React.useEffect(() => {
    if (isControlledValue) {
      setInternalValue(value as string | string[]);
    }
  }, [isControlledValue, value]);

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (multiSelect) {
        // Functional update to avoid stale closures
        if (!isControlledValue) {
          setInternalValue((prev) => {
            const currentValues = Array.isArray(prev) ? (prev as string[]) : [];
            const isSelected = currentValues.includes(newValue);

            if (!isSelected) {
              if (maxSelections && currentValues.length >= maxSelections) {
                return currentValues; // limit reached
              }
              const updated = [...currentValues, newValue];
              onValueChange?.(updated);
              return updated;
            }

            const updated = currentValues.filter((v) => v !== newValue);
            onValueChange?.(updated);
            return updated;
          });
        } else {
          // Controlled value: compute next and notify only
          const currentValues = Array.isArray(internalValue) ? (internalValue as string[]) : [];
          const isSelected = currentValues.includes(newValue);
          let updated: string[];
          if (isSelected) {
            updated = currentValues.filter((v) => v !== newValue);
          } else {
            if (maxSelections && currentValues.length >= maxSelections) {
              return;
            }
            updated = [...currentValues, newValue];
          }
          onValueChange?.(updated);
        }
      } else {
        if (!isControlledValue) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        setOpen(false);
      }
    },
    [multiSelect, isControlledValue, internalValue, maxSelections, onValueChange, setOpen]
  );

  const handleRemoveSelection = React.useCallback(
    (valueToRemove: string) => {
      if (!multiSelect) return;

      if (!isControlledValue) {
        setInternalValue((prev) => {
          const currentValues = Array.isArray(prev) ? (prev as string[]) : [];
          const updated = currentValues.filter((v) => v !== valueToRemove);
          onValueChange?.(updated);
          return updated;
        });
      } else {
        const currentValues = Array.isArray(internalValue) ? (internalValue as string[]) : [];
        const updated = currentValues.filter((v) => v !== valueToRemove);
        onValueChange?.(updated);
      }
    },
    [multiSelect, isControlledValue, internalValue, onValueChange]
  );

  const contextValue = React.useMemo<ComboboxContextType>(
    () => ({
      value: internalValue,
      onValueChange,
      multiSelect,
      maxSelections,
      disabled,
      open,
      setOpen,
      handleValueChange,
      handleRemoveSelection,
    }),
    [
      internalValue,
      onValueChange,
      multiSelect,
      maxSelections,
      disabled,
      open,
      setOpen,
      handleValueChange,
      handleRemoveSelection,
    ]
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </ComboboxContext.Provider>
  );
}

function ComboboxButton({ className, children, disabled = false }: ComboboxButtonProps) {
  const { disabled: ctxDisabled, open } = useComboboxContext();
  const isDisabled = disabled || ctxDisabled;
  return (
    <Popover.Button
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={className}
    >
      {children}
    </Popover.Button>
  );
}

function ComboboxOptions({
  children,
  showSearch = false,
  searchPlaceholder,
  maxHeight,
  className,
  inputClassName,
  optionsContainerClassName,
  emptyMessage,
}: ComboboxOptionsProps) {
  const { multiSelect } = useComboboxContext();
  return (
    <Popover.Panel sideOffset={8} className={cn(className)}>
      <Command>
        {showSearch && <Command.Input placeholder={searchPlaceholder} className={cn(inputClassName)} />}
        <Command.List
          className={cn(
            {
              "max-h-60": maxHeight === "lg",
              "max-h-48": maxHeight === "md",
              "max-h-36": maxHeight === "rg",
              "max-h-28": maxHeight === "sm",
            },
            optionsContainerClassName
          )}
          role="listbox"
          aria-multiselectable={multiSelect || undefined}
        >
          {children}
        </Command.List>
        <Command.Empty>{emptyMessage ?? "No options found."}</Command.Empty>
      </Command>
    </Popover.Panel>
  );
}

function ComboboxOption({ value, children, disabled, className }: ComboboxOptionProps) {
  const { handleValueChange, multiSelect, maxSelections, value: selectedValue } = useComboboxContext();

  const stringValue = value;
  const isSelected = React.useMemo(() => {
    if (!multiSelect) return false;
    return Array.isArray(selectedValue) ? (selectedValue as string[]).includes(stringValue) : false;
  }, [multiSelect, selectedValue, stringValue]);

  const reachedMax = React.useMemo(() => {
    if (!multiSelect || !maxSelections) return false;
    const currentLength = Array.isArray(selectedValue) ? (selectedValue as string[]).length : 0;
    return currentLength >= maxSelections && !isSelected;
  }, [multiSelect, maxSelections, selectedValue, isSelected]);

  const isDisabled = disabled || reachedMax;

  return (
    <Command.Item value={stringValue} disabled={isDisabled} onSelect={handleValueChange} className={className}>
      {children}
    </Command.Item>
  );
}

// compound component
const Combobox = Object.assign(ComboboxComponent, {
  Button: ComboboxButton,
  Options: ComboboxOptions,
  Option: ComboboxOption,
});

export { Combobox };
