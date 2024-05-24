import { Fragment, useRef, useState } from "react";
import { Check, GripVertical, MoveRight, Pencil, Trash2, X } from "lucide-react";
import { Select } from "@headlessui/react";
import { Draggable } from "@plane/ui";
import { InlineEdit } from "./inline-editable";
import { TEstimatePointsObject } from "../types";

type Props = {
  item: TEstimatePointsObject;
  deleteItem: () => void;
};
const EstimateItem = ({ item, deleteItem }: Props) => {
  const { value, id } = item;

  const inputRef = useRef<HTMLInputElement>(null);
  const [showDeleteUI, setShowDeleteUI] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = () => {
    if (id) {
      setShowDeleteUI(true);
    } else {
      deleteItem();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const handleSave = () => {
    if (id) {
      // Make the api call to save the estimate point
      // Show a spinner
      setIsEditing(false);
    }
  };
  return (
    <Draggable data={item}>
      {isEditing && (
        <div className="flex justify-between items-center gap-4 mb-2">
          <input
            type="text"
            value={value}
            onChange={() => {}}
            className="border rounded-md border-custom-border-300  p-3 flex-grow"
            ref={inputRef}
          />
          <div>
            <div className="flex gap-4 justify-between items-center">
              <Check className="w-6 h-6" onClick={handleSave} />
              <X className="w-6 h-6" onClick={() => setIsEditing(false)} />
            </div>
          </div>
        </div>
      )}
      {!isEditing && (
        <div className="border rounded-md border-custom-border-300 mb-2 p-3 flex justify-between items-center">
          <div className="flex items-center">
            <GripVertical className="w-4 h-4" />
            {!showDeleteUI ? <InlineEdit value={value} /> : value}
            {showDeleteUI && (
              <Fragment>
                <MoveRight className="w-4 h-4 mx-2" />
                <Select>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="delayed">Delayed</option>
                  <option value="canceled">Canceled</option>
                </Select>
                <Check className="w-4 h-4 rounded-md" />
                <X className="w-4 h-4 rounded-md" onClick={() => setShowDeleteUI(false)} />
              </Fragment>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <Pencil className="w-4 h-4" onClick={handleEdit} />
            {!showDeleteUI && <Trash2 className="w-4 h-4" onClick={handleDelete} />}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export { EstimateItem };
