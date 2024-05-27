import { FC, Fragment, useEffect, useRef, useState } from "react";
import { Check, GripVertical, MoveRight, Pencil, Trash2, X } from "lucide-react";
import { Select } from "@headlessui/react";
import { TEstimatePointsObject } from "@plane/types";
import { Draggable } from "@plane/ui";
// constants
import { EEstimateUpdateStages } from "@/constants/estimates";
// components
import { InlineEdit } from "./inline-editable";

type TEstimatePointItem = {
  mode: EEstimateUpdateStages;
  item: TEstimatePointsObject;
  editItem: (value: string) => void;
  deleteItem: () => void;
};

const EstimatePointItem: FC<TEstimatePointItem> = (props) => {
  // props
  const { mode, item, editItem, deleteItem } = props;
  const { id, key, value } = item;
  // ref
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteUI, setShowDeleteUI] = useState(false);

  useEffect(() => {
    if (inputValue === undefined) setInputValue(value);
  }, [value, inputValue]);

  const handleSave = () => {
    if (id) {
      // Make the api call to save the estimate point
      // Show a spinner
      setIsEditing(false);
    }
  };

  const handleEdit = (value: string) => {
    if (id) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else {
      setInputValue(value);
      editItem(value);
    }
  };

  const handleDelete = () => {
    if (id) {
      setShowDeleteUI(true);
    } else {
      deleteItem();
    }
  };

  return (
    <Draggable data={item}>
      {mode === EEstimateUpdateStages.CREATE && (
        <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2">
          <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-custom-text-200" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleEdit(e.target.value)}
            className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none py-2.5"
          />
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="text-custom-text-200" />
          </div>
        </div>
      )}

      {mode === EEstimateUpdateStages.EDIT && (
        <>
          <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2">
            <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
              <GripVertical size={14} className="text-custom-text-200" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none py-2.5"
            />
            <div
              className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
              onClick={handleDelete}
            >
              <Pencil size={14} className="text-custom-text-200" />
            </div>
            <div
              className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
              onClick={handleDelete}
            >
              <Trash2 size={14} className="text-custom-text-200" />
            </div>
          </div>
        </>
      )}

      {mode === EEstimateUpdateStages.SWITCH && (
        <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2">
          <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-custom-text-200" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none py-2.5"
          />
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={handleDelete}
          >
            <Pencil size={14} className="text-custom-text-200" />
          </div>
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="text-custom-text-200" />
          </div>
        </div>
      )}

      {/* <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-3">
        <GripVertical size={14} className="text-custom-text-200" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={() => {}}
          className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none py-2.5"
        />
        <Pencil size={14} className="text-custom-text-200" />
        <Trash2 size={14} className="text-custom-text-200" />
        <Check size={14} className="text-custom-text-200" />
        <X size={14} className="text-custom-text-200" />
      </div> */}

      {/* {isEditing && (
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            value={value}
            onChange={() => {}}
            className="border rounded-md border-custom-border-300 p-3 flex-grow"
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
      )} */}
    </Draggable>
  );
};

export { EstimatePointItem };
