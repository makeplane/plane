import { HTMLInputTypeAttribute, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

type Props = {
  onSave?: (value: string | number) => void;
  value: string | number;
  inputType?: HTMLInputTypeAttribute;
  isEditing?: boolean;
};
const InlineEdit = ({
  onSave,
  value: defaultValue,
  inputType = "text",
  isEditing: defaultIsEditing = false,
}: Props) => {
  const [isEditing, setIsEditing] = useState(defaultIsEditing);
  const [value, setValue] = useState(defaultValue);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add listener to double click on the div
  useEffect(() => {
    wrapperRef?.current?.addEventListener("dblclick", () => {
      setIsEditing(true);
      setTimeout(() => {
        inputRef?.current?.select();
      });
    });
  }, []);

  const handleSave = () => {
    if (value) {
      typeof value === "string" && value.trim();
      onSave && onSave(value);
      setIsEditing(false);
    }
  };

  return (
    <div ref={wrapperRef}>
      {isEditing ? (
        <div className="flex justify-start items-center gap-2">
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex flex-grow border-custom-border-300 border rounded-sm"
          />
          <Check onClick={handleSave} className="w-6 h-6 bg-custom-primary-100 rounded-sm" />
          <X
            onClick={() => {
              setValue(defaultValue);
              setIsEditing(false);
            }}
            className="w-6 h-6 bg-custom-background-80 rounded-sm"
          />
        </div>
      ) : (
        value
      )}
    </div>
  );
};

export { InlineEdit };
