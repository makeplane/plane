import * as React from "react";
import { cn } from "../utils";

export interface OAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const OAuthButton = React.forwardRef<HTMLButtonElement, OAuthButtonProps>((props, ref) => {
  const { text, icon, compact = false, className = "", ...rest } = props;

  return (
    <button
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-2 rounded-md border border-custom-border-300 px-4 py-2.5 text-sm font-medium text-custom-text-100 duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300",
        className
      )}
      {...rest}
    >
      <div className="flex flex-shrink-0 items-center justify-center">{icon}</div>
      {!compact && (
        <div className="flex flex-grow items-center justify-center transition-opacity duration-300">{text}</div>
      )}
    </button>
  );
});

OAuthButton.displayName = "plane-ui-oauth-button";

export { OAuthButton };
