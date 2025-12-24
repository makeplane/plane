import * as React from "react";
import { cn } from "../utils";
import { OAuthButton } from "./oauth-button";

export type TOAuthOption = {
  id: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  enabled?: boolean;
};

type OAuthOptionsProps = {
  options: TOAuthOption[];
  compact?: boolean;

  className?: string;
  containerClassName?: string;
};

export function OAuthOptions(props: OAuthOptionsProps) {
  const { options, compact = false, className = "", containerClassName = "" } = props;

  // Filter enabled options
  const enabledOptions = options.filter((option) => option.enabled !== false);

  if (enabledOptions.length === 0) return null;

  return (
    <div className={cn("w-full", containerClassName)}>
      <div
        className={cn(
          "flex gap-4 overflow-hidden transition-all duration-500 ease-in-out",
          compact ? "flex-row" : "flex-col",
          className
        )}
      >
        {enabledOptions.map((option) => (
          <OAuthButton
            key={option.id}
            text={option.text}
            icon={option.icon}
            onClick={option.onClick}
            compact={compact}
            className="transition-all duration-300 ease-in-out"
          />
        ))}
      </div>

      <div className="mt-4 flex items-center transition-all duration-300">
        <hr className="w-full border-strong transition-colors duration-300" />
        <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder transition-colors duration-300">or</p>
        <hr className="w-full border-strong transition-colors duration-300" />
      </div>
    </div>
  );
}
