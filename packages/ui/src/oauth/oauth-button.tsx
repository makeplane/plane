import * as React from "react";
import { cn } from "../utils";

export interface OAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const OAuthButton = React.forwardRef(function OAuthButton(
  props: OAuthButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const { text, icon, compact = false, className = "", ...rest } = props;

  return (
    <button
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-2 rounded-md border border-strong px-4 py-2.5 text-13 font-medium text-primary duration-300 bg-onboarding-background-200 hover:bg-onboarding-background-300",
        className
      )}
      {...rest}
    >
      <div className="flex flex-shrink-0 items-center justify-center">{icon}</div>
      {!compact && (
        <span className="flex flex-grow items-center justify-center transition-opacity duration-300 text-body-sm-regular">
          {text}
        </span>
      )}
    </button>
  );
});

OAuthButton.displayName = "plane-ui-oauth-button";

export { OAuthButton };
