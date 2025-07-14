// plane imports
import type { IMarking } from "@plane/editor";
import { cn } from "@plane/utils";

export type THeadingComponentProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const COMMON_CLASSNAME =
  "flex-shrink-0 w-full py-1 text-left font-medium text-custom-text-300 hover:text-custom-primary-100 truncate transition-colors";

export const OutlineHeading1 = ({ marking, onClick }: THeadingComponentProps) => (
  <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-sm pl-1")}>
    {marking.text}
  </button>
);

export const OutlineHeading2 = ({ marking, onClick }: THeadingComponentProps) => (
  <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-xs pl-2")}>
    {marking.text}
  </button>
);

export const OutlineHeading3 = ({ marking, onClick }: THeadingComponentProps) => (
  <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-xs pl-4")}>
    {marking.text}
  </button>
);
