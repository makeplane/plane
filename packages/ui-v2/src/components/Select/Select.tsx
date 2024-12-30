import React, { useCallback } from "react";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { SelectItem } from "./SelectItem";

type SelectProps = {
  items: any[];
  onChange: (value: any) => void;
  value: any;
  renderItem: (item: any) => React.ReactNode;
  renderGroup: (group: string) => React.ReactNode;
  multiple?: boolean;
  keyExtractor?: (item: any) => string;
  showSelectedAtTop?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  onSearch?: (query: String) => void;
};

export const Select = (props: SelectProps) => {
  const {
    items,
    onChange,
    renderItem: Item,
    renderGroup,
    multiple,
    value: initialValue = [],
    keyExtractor = (item) => item.id,
    showSelectedAtTop = true,
    defaultOpen = false,
    children,
    onSearch,
  } = props;

  const [value, setValue] = React.useState(initialValue);
  const [open, setOpen] = React.useState(defaultOpen);

  const handleSelect = useCallback(
    (e: React.MouseEvent, item: any) => {
      const key = keyExtractor(item);
      if (multiple) {
        e.preventDefault();
        e.stopPropagation();

        // If values includes item, remove it
        if (value.includes(key)) {
          setValue(value.filter((v) => v !== key));
        } else {
          setValue([...value, key]);
        }
        onChange([...value, key]);
      } else {
        setValue([key]);
        onChange([key]);
      }
    },
    [value]
  );

  const renderItem_ = useCallback(
    (item: any) => {
      const key = keyExtractor(item);
      const selected = value.includes(key);
      return (
        <SelectItem item={item} selected={selected} render={Item}></SelectItem>
      );
    },
    [value, keyExtractor]
  );

  const orderedItems = React.useMemo(() => {
    if (showSelectedAtTop && open) {
      // Move selected items to the top
      return [
        ...items.filter((item) => value.includes(keyExtractor(item))),
        ...items.filter((item) => !value.includes(keyExtractor(item))),
      ];
    }
    return items;
  }, [initialValue, open]);

  const handleOpenChange = useCallback((open_: boolean) => {
    setOpen(open_);
  }, []);

  return (
    <DropdownMenu
      defaultOpen={defaultOpen}
      items={orderedItems}
      renderItem={renderItem_}
      onSelect={handleSelect}
      onOpenChange={handleOpenChange}
      onSearch={onSearch}
    >
      {children}
    </DropdownMenu>
  );
};
