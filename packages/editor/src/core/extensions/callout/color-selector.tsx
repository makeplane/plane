import { Ban } from "lucide-react";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane utils
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";

type Props = {
  disabled: boolean;
  isOpen: boolean;
  onSelect: (color: string | null) => void;
  toggleDropdown: () => void;
};

export function CalloutBlockColorSelector(props: Props) {
  const { disabled, isOpen, onSelect, toggleDropdown } = props;

  const handleColorSelect = (val: string | null) => {
    onSelect(val);
    toggleDropdown();
  };

  return (
    <div
      className={cn("opacity-0 pointer-events-none absolute top-2 right-2 z-10 transition-opacity", {
        "group-hover/callout-node:opacity-100 group-hover/callout-node:pointer-events-auto": !disabled,
        "opacity-100 pointer-events-auto": isOpen,
      })}
      contentEditable={false}
    >
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            toggleDropdown();
            e.stopPropagation();
          }}
          className={cn(
            "flex items-center gap-1 h-full whitespace-nowrap py-1 px-2.5 text-13 font-medium text-tertiary hover:bg-layer-1-hover active:bg-layer-1-active rounded-sm transition-colors",
            {
              "bg-layer-1": isOpen,
            }
          )}
          disabled={disabled}
        >
          <span className="text-12">Color</span>
          <ChevronDownIcon className="flex-shrink-0 size-3" />
        </button>
        {isOpen && (
          <section className="absolute top-full right-0 z-10 mt-1 rounded-md border-[0.5px] border-strong bg-surface-1 p-2 shadow-raised-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              {COLORS_LIST.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className="flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity"
                  style={{
                    backgroundColor: color.backgroundColor,
                  }}
                  onClick={() => handleColorSelect(color.key)}
                />
              ))}
              <button
                type="button"
                className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-1-hover transition-colors"
                onClick={() => handleColorSelect(null)}
              >
                <Ban className="size-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
