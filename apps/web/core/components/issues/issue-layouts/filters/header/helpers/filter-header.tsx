// plane imports
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";

type Props = {
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
};

export function FilterHeader({ title, isPreviewEnabled, handleIsPreviewEnabled }: Props) {
  return (
    <div className="sticky top-0 flex items-center justify-between gap-2 bg-surface-1">
      <div className="flex-grow truncate text-caption-sm-medium text-placeholder">{title}</div>
      <button
        type="button"
        className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-sm hover:bg-layer-transparent-hover"
        onClick={handleIsPreviewEnabled}
      >
        {isPreviewEnabled ? <ChevronUpIcon height={14} width={14} /> : <ChevronDownIcon height={14} width={14} />}
      </button>
    </div>
  );
}
