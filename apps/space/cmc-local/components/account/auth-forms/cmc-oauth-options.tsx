/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import type { TOAuthOption } from "@plane/types";
import { cn } from "@plane/ui";
// constants
import { CMC_AUTH_BRANDING, CMC_AUTH_KEYCLOAK_PROVIDER_ID } from "@/constants/cmc-auth";

type CmcOAuthOptionsProps = {
  options: TOAuthOption[];
  compact?: boolean;
  showDivider?: boolean;
  className?: string;
  containerClassName?: string;
};

type CmcOAuthButtonProps = {
  text: string;
  icon: ReactNode;
  onClick: () => void;
  compact: boolean;
  className?: string;
};

function CmcOAuthButton(props: CmcOAuthButtonProps) {
  const { text, icon, onClick, compact, className = "" } = props;
  const showText = !compact || !icon;

  return (
    <button
      type="button"
      aria-label={text}
      className={cn(
        "bg-onboarding-background-200 hover:bg-onboarding-background-300 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-strong px-4 py-2.5 text-13 font-medium text-primary duration-300",
        className
      )}
      onClick={onClick}
    >
      {icon && <div className="flex flex-shrink-0 items-center justify-center">{icon}</div>}
      {showText && (
        <span className="flex flex-grow items-center justify-center text-body-sm-regular transition-opacity duration-300">
          {text}
        </span>
      )}
    </button>
  );
}

export function CmcOAuthOptions(props: CmcOAuthOptionsProps) {
  const { options, compact = false, showDivider = true, className = "", containerClassName = "" } = props;

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
        {enabledOptions.map((option) => {
          const isCmcSso = option.id === CMC_AUTH_KEYCLOAK_PROVIDER_ID;

          return (
            <CmcOAuthButton
              key={option.id}
              text={isCmcSso ? CMC_AUTH_BRANDING.ssoButtonText : option.text}
              icon={isCmcSso ? null : option.icon}
              onClick={option.onClick}
              compact={compact}
              className="transition-all duration-300 ease-in-out"
            />
          );
        })}
      </div>

      {showDivider && (
        <div className="mt-4 flex items-center transition-all duration-300">
          <hr className="w-full border-strong transition-colors duration-300" />
          <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder transition-colors duration-300">or</p>
          <hr className="w-full border-strong transition-colors duration-300" />
        </div>
      )}
    </div>
  );
}
