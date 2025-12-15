import * as React from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker(props: ColorPickerProps) {
  const { value, onChange, className = "" } = props;
  // refs
  const inputRef = React.useRef<HTMLInputElement>(null);

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-center relative">
      <button
        className={`size-4 rounded-full cursor-pointer conical-gradient ${className}`}
        onClick={handleOnClick}
        aria-label="Open color picker"
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-4 invisible"
        aria-hidden="true"
      />
    </div>
  );
}
