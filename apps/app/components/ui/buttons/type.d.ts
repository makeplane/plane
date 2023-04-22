import { ButtonHTMLAttributes } from "react";

/**
 * Props for a customizable Button component.
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Whether or not to display a loading state for the button. */
  loading?: boolean;

  /** The size of the button (e.g. 'sm', 'md', 'lg'). Defaults to 'sm'. */
  size?: "sm" | "md" | "lg";

  /** Whether or not to display the button with an outline. */
  outline?: boolean;
};
