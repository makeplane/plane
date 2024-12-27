import React, { useCallback } from "react";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { DropdownButton } from "../DropdownMenu/components/DropdownButton";
import { CheckIcon } from "@radix-ui/react-icons";

const EmptyIcon = () => (
  <div style={{ width: "15px", height: "15px" }}>&nbsp;</div>
);
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
  } = props;

  const [value, setValue] = React.useState(initialValue);
  const [open, setOpen] = React.useState(defaultOpen);

  const handleSelect = (e: React.MouseEvent, item: any) => {
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
  };

  const renderItem_ = useCallback(
    (item: any) => {
      const key = keyExtractor(item);
      const selected = value.includes(key);
      return (
        <div className="flex items-center gap-2 justify-between">
          {<Item fruit={item} />}
          {/* Added empty icon to reserve space */}
          {selected ? <CheckIcon /> : <EmptyIcon />}
        </div>
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
    >
      {children}
    </DropdownMenu>
  );
};
