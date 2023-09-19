import { FilterPreviewClear } from "./clear";

interface IFilterPreviewContent {
  icon?: React.ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
  style?: any;
}

export const FilterPreviewContent = ({ icon, title, onClick, className, style }: IFilterPreviewContent) => (
  <div
    className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-[8px] transition-all ${className}`}
    style={style ? style : {}}
  >
    <div className="flex-shrink-0">{icon}</div>
    <div className="text-xs w-full whitespace-nowrap font-medium">{title}</div>
    <div className="flex-shrink-0">
      <FilterPreviewClear
        onClick={() => {
          if (onClick) onClick();
        }}
      />
    </div>
  </div>
);
