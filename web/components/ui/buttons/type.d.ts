export type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: any) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  outline?: boolean;
};
