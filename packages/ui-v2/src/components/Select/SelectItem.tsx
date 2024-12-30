/**
 * SelectItem
 * @description Takes render function, item, and if its selected as a prop
 * @param {Function} render
 * @param {Object} item
 * @param {Boolean} selected
 */

import { CheckIcon } from "@radix-ui/react-icons";
import React from "react";

const EmptyIcon = () => (
  <div style={{ width: "15px", height: "15px" }}>&nbsp;</div>
);

type Props = {
  item: any;
  selected: boolean;
  render: any;
};
const SelectItem_ = ({ render: Item, item, selected }: Props) => {
  return (
    <div className="flex items-center gap-2 justify-between">
      <Item item={item} />
      {/* Added empty icon to reserve space */}
      {selected ? <CheckIcon /> : <EmptyIcon />}
    </div>
  );
};

export const SelectItem = React.memo(SelectItem_);
