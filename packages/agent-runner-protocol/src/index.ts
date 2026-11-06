/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export {
  INITIAL_MODE_META_KEY,
  PERMISSION_LEVELS,
  clampPermissionLevel,
  isPermissionLevel,
  permissionRank,
} from "./levels.ts";
export type { PermissionLevel } from "./levels.ts";
export {
  DEFAULT_TICKET_TTL_MS,
  MAX_TICKET_TTL_MS,
  MIN_SECRET_LENGTH,
  TicketReplayGuard,
  assertTicketSecret,
  signSpawnTicket,
  verifySpawnTicket,
} from "./ticket.ts";
export type {
  SignOptions,
  SpawnClaims,
  SpawnTicket,
  TicketFailure,
  TicketVerification,
  VerifyOptions,
} from "./ticket.ts";
