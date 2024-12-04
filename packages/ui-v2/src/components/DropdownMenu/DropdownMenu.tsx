import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import * as Select from "@radix-ui/react-select";
import React, { createContext } from "react";

type SelectDropdownProps = {
  items: any[];
  onSelect: any;
  onChange: any;
  value: any;
  children: React.ReactNode;
  multiple?: boolean;
  open?: boolean;
  renderItem: (item: any) => React.ReactNode;
  renderGroup: (group: string) => React.ReactNode;
};

type SelectButtonProps = {
  children: React.ReactNode;
  showIcon?: boolean;
};

type SelectContentProps = {
  children: React.ReactNode;
};
const SelectContext = createContext<SelectDropdownProps>({});

export const SelectButton = ({
  children,
  showIcon = false,
}: SelectButtonProps) => {
  return (
    <Select.Trigger
      className="inline-flex h-[35px]  
  items-center justify-between gap-[5px] rounded bg-white px-[15px] text-[13px] leading-none"
      aria-label="Food"
      style={{ width: "200px" }}
    >
      <Select.Value placeholder="Select a fruit…">{children}</Select.Value>
      {showIcon && (
        <Select.Icon className="text-violet11">
          <ChevronDownIcon />
        </Select.Icon>
      )}
    </Select.Trigger>
  );
};

export const SelectContent = ({ children }: SelectContentProps) => {
  const { items, renderItem, renderGroup, value } =
    React.useContext(SelectContext);

  let groupedItems: { [key: string]: any[] } = {};

  if (Array.isArray(items)) {
    groupedItems.default = items;
  } else {
    groupedItems = items;
  }

  // Sort items within each group to put selected items at the top
  Object.keys(groupedItems).forEach((group) => {
    groupedItems[group].sort((a, b) => {
      const aSelected = value.includes(a);
      const bSelected = value.includes(b);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  });

  return (
    <Select.Portal>
      <Select.Content className="  rounded-md bg-white border border-border-neutral">
        <Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport className="p-[5px]">
          {Object.keys(groupedItems).map((group) => (
            <Select.Group key={group}>
              {group !== "default" && (
                <Select.Label>
                  {renderGroup ? renderGroup(group) : group}
                </Select.Label>
              )}
              {groupedItems[group].map((item) => (
                <SelectOption key={item.name} value={item}>
                  <div className="flex items-center gap-2 justify-between">
                    {renderItem(item)}
                    {value.includes(item) && <CheckIcon />}
                  </div>
                </SelectOption>
              ))}
            </Select.Group>
          ))}
          {/* <Select.Group key={group}>
              {children}

              {sortedItems.map((item) => (
                <SelectOption key={item.name} value={item}>
                  <div className="flex items-center gap-2 justify-between">
                    {renderItem(item)}
                    {value.includes(item) && <CheckIcon />}
                  </div>
                </SelectOption>
              ))}
            </Select.Group> */}
        </Select.Viewport>
        <Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  );
};

export const SelectOption = ({ children, value }) => {
  return (
    <Select.Item value={value}>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
};
export const SelectDropdown = ({
  items,
  onSelect,
  onChange,
  value: _value,
  children,
  multiple = false,
  open: _open,
  renderItem,
  renderGroup,
}: SelectDropdownProps) => {
  const [value, setValue] = React.useState(_value || items[0]);
  const [open, setOpen] = React.useState(_open);

  const handleValueChange = (nextValue) => {
    if (multiple) {
      let selected;
      const valueIndex = value.findIndex((v) => v.id === nextValue.id);
      if (valueIndex >= 0) {
        // Remove if found
        selected = value.filter((_, i) => i !== valueIndex);
      } else {
        // Add if not found
        selected = [...value, nextValue];
      }
      setValue(selected);
      onChange(selected);
    } else {
      setValue(nextValue);
      onChange(nextValue);
    }
  };
  const handleOpenChange = (open) => {
    if (multiple && !open) {
      setOpen(true);
      return;
    }
    setOpen(open);
  };
  return (
    <SelectContext.Provider
      value={{ items, onSelect, onChange, value, renderItem, renderGroup }}
    >
      <Select.Root
        value={value}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        open={open}
      >
        {children}
      </Select.Root>
    </SelectContext.Provider>
  );
};
