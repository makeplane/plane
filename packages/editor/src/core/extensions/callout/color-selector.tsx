import { Ban, ChevronDown } from "lucide-react";
// constants
import { COLORS_LIST } from "@/constants/common";
// helpers
import { cn } from "@/helpers/common";

type Props = {
  disabled: boolean;
  isOpen: boolean;
  onSelect: (color: string | null) => void;
  toggleDropdown: () => void;
};

export const CalloutBlockColorSelector: React.FC<Props> = (props) => {
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
            "flex items-center gap-1 h-full whitespace-nowrap py-1 px-2.5 text-sm font-medium text-custom-text-300 hover:bg-white/10 active:bg-custom-background-80 rounded transition-colors",
            {
              "bg-white/10": isOpen,
            }
          )}
          disabled={disabled}
        >
          <span>Color</span>
          <ChevronDown className="flex-shrink-0 size-3" />
        </button>
        {isOpen && (
          <section className="absolute top-full right-0 z-10 mt-1 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 p-2 shadow-custom-shadow-rg animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              {COLORS_LIST.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className="flex-shrink-0 size-6 rounded border-[0.5px] border-custom-border-400 hover:opacity-60 transition-opacity"
                  style={{
                    backgroundColor: color.backgroundColor,
                  }}
                  onClick={() => handleColorSelect(color.key)}
                />
              ))}
              <button
                type="button"
                className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-300 border-[0.5px] border-custom-border-400 hover:bg-custom-background-80 transition-colors"
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
};
