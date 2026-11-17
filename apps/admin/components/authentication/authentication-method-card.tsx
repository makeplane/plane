/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// helpers
import { cn } from "@plane/utils";

type Props = {
  name: string;
  description: string;
  icon: React.ReactNode;
  config: React.ReactNode;
  disabled?: boolean;
  withBorder?: boolean;
  unavailable?: boolean;
};

export function AuthenticationMethodCard(props: Props) {
  const { name, description, icon, config, disabled = false, withBorder = true, unavailable = false } = props;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-start gap-4 rounded-lg md:flex-row md:items-center md:justify-between md:gap-8",
        {
          "border border-subtle bg-layer-2 px-4 py-3": withBorder,
        }
      )}
    >
      <div
        className={cn("flex min-w-0 grow items-start gap-3 md:items-center", {
          "opacity-50": unavailable,
        })}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-layer-1 p-1.5">{icon}</div>
        <div className="min-w-0 grow space-y-1">
          <div
            className={cn("text-primary", {
              "text-body-sm-medium": withBorder,
              "text-h5-semibold": !withBorder,
            })}
          >
            {name}
          </div>
          <div
            className={cn("text-tertiary", {
              "text-body-xs-regular": withBorder,
              "text-body-sm-regular": !withBorder,
            })}
          >
            {description}
          </div>
        </div>
      </div>
      <div className={cn("shrink-0", { "opacity-70": disabled })}>{config}</div>
    </div>
  );
}
