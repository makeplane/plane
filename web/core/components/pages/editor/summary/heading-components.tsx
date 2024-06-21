// document editor
import { IMarking } from "@plane/editor";

type HeadingProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const OutlineHeading1 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="text-sm text-left font-medium text-custom-text-300 hover:text-custom-primary-100"
  >
    {marking.text}
  </button>
);

export const OutlineHeading2 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-2 text-xs text-left font-medium text-custom-text-300 hover:text-custom-primary-100"
  >
    {marking.text}
  </button>
);

export const OutlineHeading3 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-4 text-xs text-left font-medium text-custom-text-300 hover:text-custom-primary-100"
  >
    {marking.text}
  </button>
);
