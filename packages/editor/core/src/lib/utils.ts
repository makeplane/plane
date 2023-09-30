import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const findTableAncestor = (
  node: Node | null
): HTMLTableElement | null => {
  while (node !== null && node.nodeName !== "TABLE") {
    node = node.parentNode;
  }
  return node as HTMLTableElement;
};

interface EditorClassNames {
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
}

export const getEditorClassNames = ({ noBorder, borderOnFocus, customClassName }: EditorClassNames) => cn(
  'relative w-full max-w-full sm:rounded-lg mt-2 p-3 relative focus:outline-none rounded-md',
  noBorder ? '' : 'border border-custom-border-200',
  borderOnFocus ? 'focus:border border-custom-border-300' : 'focus:border-0',
  customClassName
);

