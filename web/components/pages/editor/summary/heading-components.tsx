// document editor
import { IMarking } from "@plane/document-editor";

type HeadingProps = {
  marking: IMarking;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const OutlineHeading1 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-4 cursor-pointer text-sm font-medium text-custom-text-400 hover:text-custom-primary-100 max-md:ml-2.5"
  >
    {marking.text}
  </button>
);

export const OutlineHeading2 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-6 cursor-pointer text-xs font-medium text-custom-text-400 hover:text-custom-primary-100"
  >
    {marking.text}
  </button>
);

export const OutlineHeading3 = ({ marking, onClick }: HeadingProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-8 cursor-pointer text-xs font-medium text-custom-text-400 hover:text-custom-primary-100"
  >
    {marking.text}
  </button>
);
