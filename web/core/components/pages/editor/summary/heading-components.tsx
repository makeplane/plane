// plane editor
import type { IMarking } from "@plane/editor";

export type THeadingComponentProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const OutlineHeading1 = ({ marking, onClick }: THeadingComponentProps) => (
  <button
    type="button"
    onClick={onClick}
    className="text-sm text-left font-medium text-custom-text-300 hover:text-custom-primary-100 transition-colors"
  >
    {marking.text}
  </button>
);

export const OutlineHeading2 = ({ marking, onClick }: THeadingComponentProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-2 text-xs text-left font-medium text-custom-text-300 hover:text-custom-primary-100 transition-colors"
  >
    {marking.text}
  </button>
);

export const OutlineHeading3 = ({ marking, onClick }: THeadingComponentProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-4 text-xs text-left font-medium text-custom-text-300 hover:text-custom-primary-100 transition-colors"
  >
    {marking.text}
  </button>
);
