// plane utils
import { cn } from "@plane/utils";
// types
import { ISlashCommandItem } from "@/types";

type Props = {
  isSelected: boolean;
  item: ISlashCommandItem;
  itemIndex: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseEnter: () => void;
  sectionIndex: number;
  query?: string;
};

// Utility to highlight matched text in a string
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query || query.trim() === "") return text;

  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();

  // Check for direct substring match
  const index = textLower.indexOf(queryLower);
  if (index >= 0) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + queryLower.length);
    const after = text.substring(index + queryLower.length);

    return (
      <>
        {before}
        <span className="font-medium text-custom-text-100">{match}</span>
        {after}
      </>
    );
  }

  // Otherwise just return the text
  return text;
};

export const CommandMenuItem: React.FC<Props> = (props) => {
  const { isSelected, item, itemIndex, onClick, onMouseEnter, sectionIndex, query } = props;

  return (
    <button
      type="button"
      id={`item-${sectionIndex}-${itemIndex}`}
      className={cn(
        "flex items-center gap-2 w-full rounded px-1 py-1.5 text-sm text-left truncate text-custom-text-200",
        {
          "bg-custom-background-80": isSelected,
        }
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span className="size-5 grid place-items-center flex-shrink-0" style={item.iconContainerStyle}>
        {item.icon}
      </span>
      <p className="flex-grow truncate">{query ? highlightMatch(item.title, query) : item.title}</p>
      {item.badge}
    </button>
  );
};
