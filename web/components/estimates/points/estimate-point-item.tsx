import { FC, Fragment, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Check, GripVertical, MoveRight, Pencil, Trash2, X } from "lucide-react";
import { Select } from "@headlessui/react";
import { TEstimatePointsObject } from "@plane/types";
import { Draggable, Spinner } from "@plane/ui";
// constants
import { EEstimateUpdateStages } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";
import { useEstimate } from "@/hooks/store";

type TEstimatePointItem = {
  estimateId: string | undefined;
  mode: EEstimateUpdateStages;
  item: TEstimatePointsObject;
  editItem: (value: string) => void;
  deleteItem: () => void;
};

export const EstimatePointItem: FC<TEstimatePointItem> = observer((props) => {
  // props
  const { estimateId, mode, item, editItem, deleteItem } = props;
  const { id, key, value } = item;
  // hooks
  const { asJson: estimate, updateEstimate, deleteEstimate } = useEstimate(estimateId);
  // ref
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  // handling editing states
  const [estimateEditLoader, setEstimateEditLoader] = useState(false);
  const [deletedEstimateValue, setDeletedEstimateValue] = useState<string | undefined>(undefined);
  const [isEstimateEditing, setIsEstimateEditing] = useState(false);
  const [isEstimateDeleting, setIsEstimateDeleting] = useState(false);

  useEffect(() => {
    if (inputValue === undefined || inputValue != value) setInputValue(value);
  }, [value, inputValue]);

  const handleCreateEdit = (value: string) => {
    setInputValue(value);
    editItem(value);
  };

  const handleEdit = async () => {
    if (id) {
      try {
        setEstimateEditLoader(true);
        await updateEstimate({ estimate_points: [{ id: id, key: key, value: value }] });
        setIsEstimateEditing(false);
        setEstimateEditLoader(false);
      } catch (error) {
        setEstimateEditLoader(false);
      }
    } else {
      if (inputValue) editItem(inputValue);
    }
  };

  const handleDelete = async () => {
    if (id) {
      try {
        setEstimateEditLoader(true);
        await deleteEstimate(deletedEstimateValue);
        setIsEstimateDeleting(false);
        setEstimateEditLoader(false);
      } catch (error) {
        setEstimateEditLoader(false);
      }
    } else {
      deleteItem();
    }
  };

  const selectDropdownOptions = estimate && estimate?.points ? estimate?.points.filter((point) => point.id !== id) : [];

  return (
    <Draggable data={item}>
      {!id && (
        <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2">
          <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-custom-text-200" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleCreateEdit(e.target.value)}
            className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none py-2.5 w-full"
          />
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="text-custom-text-200" />
          </div>
        </div>
      )}

      {id && (
        <>
          {mode === EEstimateUpdateStages.EDIT && (
            <>
              {!isEstimateEditing && !isEstimateDeleting && (
                <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2">
                  <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
                    <GripVertical size={14} className="text-custom-text-200" />
                  </div>
                  <div className="py-2.5 flex-grow" onClick={() => setIsEstimateEditing(true)}>
                    {value}
                  </div>
                  <div
                    className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
                    onClick={() => setIsEstimateEditing(true)}
                  >
                    <Pencil size={14} className="text-custom-text-200" />
                  </div>
                  <div
                    className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
                    onClick={() => setIsEstimateDeleting(true)}
                  >
                    <Trash2 size={14} className="text-custom-text-200" />
                  </div>
                </div>
              )}

              {(isEstimateEditing || isEstimateDeleting) && (
                <div className="relative flex items-center gap-2">
                  <div className="flex-grow relative flex items-center gap-3">
                    <div className="flex-grow border border-custom-border-200 rounded">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={cn(
                          "flex-grow border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full",
                          isEstimateDeleting ? `bg-custom-background-90` : `bg-transparent`
                        )}
                        disabled={isEstimateDeleting}
                      />
                    </div>
                    {isEstimateDeleting && <MoveRight size={14} />}
                    {isEstimateDeleting && (
                      <div className="relative flex-grow rounded border border-custom-border-200 flex items-center gap-3 p-2.5">
                        <Select
                          className="bg-transparent flex-grow focus:ring-0 focus:border-0 focus:outline-none"
                          value={deletedEstimateValue}
                          onChange={(e) => setDeletedEstimateValue(e.target.value)}
                        >
                          <option value={undefined}>None</option>
                          {selectDropdownOptions.map((option) => (
                            <option key={option?.id} value={option?.value}>
                              {option?.value}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                  {estimateEditLoader ? (
                    <div className="w-6 h-6 flex-shrink-0 relative flex justify-center items-center rota">
                      <Spinner className="w-4 h-4" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer",
                        isEstimateEditing ? `text-green-500` : `text-red-500`
                      )}
                      onClick={() => (isEstimateEditing ? handleEdit() : handleDelete())}
                    >
                      {isEstimateEditing ? <Check size={14} /> : <Trash2 size={14} />}
                    </div>
                  )}

                  <div
                    className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
                    onClick={() => (isEstimateEditing ? setIsEstimateEditing(false) : setIsEstimateDeleting(false))}
                  >
                    <X size={14} className="text-custom-text-200" />
                  </div>
                </div>
              )}
            </>
          )}

          {mode === EEstimateUpdateStages.SWITCH && (
            <div className="flex-grow relative flex items-center gap-3">
              <div className="flex-grow border border-custom-border-200 rounded">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 bg-custom-background-90 w-full"
                  disabled
                />
              </div>
              <MoveRight size={14} />
              <div className="flex-grow border border-custom-border-200 rounded">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow border-none bg-transparent focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full"
                />
              </div>
            </div>
          )}
        </>
      )}
    </Draggable>
  );
});
