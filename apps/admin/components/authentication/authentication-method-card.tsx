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
      className={cn("flex w-full items-center gap-14 rounded-lg bg-layer-2", {
        "border border-subtle px-4 py-3": withBorder,
      })}
    >
      <div
        className={cn("flex grow items-center gap-4", {
          "opacity-50": unavailable,
        })}
      >
        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-layer-1">{icon}</div>
        </div>
        <div className="grow">
          <div
            className={cn("leading-5 font-medium text-primary", {
              "text-13": withBorder,
              "text-18": !withBorder,
            })}
          >
            {name}
          </div>
          <div
            className={cn("leading-5 font-regular text-tertiary", {
              "text-11": withBorder,
              "text-13": !withBorder,
            })}
          >
            {description}
          </div>
        </div>
      </div>
      <div className={`shrink-0 ${disabled && "opacity-70"}`}>{config}</div>
    </div>
  );
}
