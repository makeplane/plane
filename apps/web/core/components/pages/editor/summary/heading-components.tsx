// plane imports
import type { IMarking } from "@plane/editor";
import { cn } from "@plane/utils";

export type THeadingComponentProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const COMMON_CLASSNAME =
  "flex-shrink-0 w-full py-1 text-left font-medium text-tertiary hover:text-accent-primary truncate transition-colors";

export function OutlineHeading1({ marking, onClick }: THeadingComponentProps) {
  return (
    <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-13 pl-1")}>
      {marking.text}
    </button>
  );
}

export function OutlineHeading2({ marking, onClick }: THeadingComponentProps) {
  return (
    <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-11 pl-2")}>
      {marking.text}
    </button>
  );
}

export function OutlineHeading3({ marking, onClick }: THeadingComponentProps) {
  return (
    <button type="button" onClick={onClick} className={cn(COMMON_CLASSNAME, "text-11 pl-4")}>
      {marking.text}
    </button>
  );
}
