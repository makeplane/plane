/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";

export interface OAuthButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style"> {
  text: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const OAuthButton = React.forwardRef(function OAuthButton(
  props: OAuthButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const { text, icon, compact = false, ...rest } = props;

  return (
    <ButtonElement
      ref={ref}
      variant="secondary"
      size="lg"
      stretch="full"
      type="button"
      {...rest}
      aria-label={rest["aria-label"] ?? (compact ? text : undefined)}
    >
      <div className="flex flex-shrink-0 items-center justify-center">{icon}</div>
      {!compact && (
        <span className="flex flex-grow items-center justify-center text-body-sm-regular transition-opacity duration-300">
          {text}
        </span>
      )}
    </ButtonElement>
  );
});

OAuthButton.displayName = "plane-ui-oauth-button";

export { OAuthButton };
