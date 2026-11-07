/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AiStarFourFilled, Claude, Codex, Deepseek } from "@makeplane/propel/icons";
import type { TAgentAdapter } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import googleLogo from "@/app/assets/logos/google-logo.svg?url";

type Props = { adapter: TAgentAdapter; className?: string };

/** The provider mark for an agent's adapter. */
export function AgentAdapterIcon({ adapter, className }: Props) {
  const classes = cn("size-4 shrink-0", className);
  switch (adapter) {
    case "claude":
      return <Claude className={classes} />;
    case "codex":
      return <Codex className={classes} />;
    case "gemini":
      return <img src={googleLogo} alt="" className={classes} />;
    case "deepseek":
      return <Deepseek className={classes} />;
    default:
      return <AiStarFourFilled className={classes} />;
  }
}
