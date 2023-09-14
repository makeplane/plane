// lucide icons
import { X } from "lucide-react";

interface IFilterPreviewClear {
  onClick?: () => void;
}

export const FilterPreviewClear = ({ onClick }: IFilterPreviewClear) => (
  <div
    className="cursor-pointer"
    onClick={() => {
      if (onClick) onClick();
    }}
  >
    <X width={12} strokeWidth={2} />
  </div>
);
