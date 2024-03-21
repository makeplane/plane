// helpers
import { cn } from "helpers/common.helper";
// types
import { IMarking } from "@plane/document-editor";

type HeadingProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void;
};

export const OutlineHeading1 = ({ marking, onClick }: HeadingProps) => (
  <h1
    onClick={onClick}
    className="pl-4 mt-3 cursor-pointer text-sm font-medium leading-[125%] tracking-tight hover:text-custom-primary max-md:ml-2.5"
    role="button"
  >
    {marking.text}
  </h1>
);

export const OutlineHeading2 = ({ marking, onClick }: HeadingProps) => (
  <h2
    onClick={onClick}
    className={cn(
      "ml-6 mt-2 cursor-pointer text-xs font-medium tracking-tight text-custom-text-400 hover:text-custom-primary"
    )}
    role="button"
  >
    {marking.text}
  </h2>
);

export const OutlineHeading3 = ({ marking, onClick }: HeadingProps) => (
  <h3
    onClick={onClick}
    className={cn(
      "ml-8 mt-2 cursor-pointer text-xs font-medium tracking-tight text-custom-text-400 hover:text-custom-primary"
    )}
    role="button"
  >
    {marking.text}
  </h3>
);
