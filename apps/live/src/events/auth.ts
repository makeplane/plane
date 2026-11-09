/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { z } from "zod";
import { AppError } from "@/lib/errors";
import { APIService } from "@/services/api.service";

export const SESSION_COOKIE_NAME = "session-id";
// Only project roles above this value (member and up) may receive events; guests are denied.
export const GUEST_ROLE = 5;

export const CLOSE_AUTH = 4401;

const WORKSPACE_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
export const isValidWorkspaceSlug = (slug: string): boolean => WORKSPACE_SLUG.test(slug);

/** Returns `session-id=<value>` from a Cookie header, or null. Nothing else is forwarded. */
export const extractSessionCookie = (header: string | undefined): string | null => {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(idx + 1).trim();
    return value ? `${SESSION_COOKIE_NAME}=${value}` : null;
  }
  return null;
};

const rolesSchema = z.record(z.string(), z.number());

export interface EventsAuthApi {
  /** Resolve the user id for a session cookie; rejects when the session is invalid. */
  currentUser(cookie: string, signal?: AbortSignal): Promise<{ id: string }>;
  /** Active project memberships for the workspace: project id -> role. */
  projectRoles(cookie: string, slug: string): Promise<Record<string, number>>;
}

class ProjectRolesService extends APIService {
  async getRoles(cookie: string, slug: string): Promise<unknown> {
    try {
      const response = await this.get(`/api/users/me/workspaces/${encodeURIComponent(slug)}/project-roles/`, {
        headers: { Cookie: cookie },
      });
      return response?.data;
    } catch (error) {
      throw new AppError(error, { context: { operation: "projectRoles" } });
    }
  }
}

// Session lookup without per-failure logging: failures are counted and logged at a limited
// rate by the hub, so unauthenticated callers cannot drive the log volume.
class CurrentUserService extends APIService {
  async getUser(cookie: string, signal?: AbortSignal): Promise<{ id?: unknown } | undefined> {
    try {
      const response = await this.get("/api/users/me/", { headers: { Cookie: cookie } }, { signal });
      return response?.data;
    } catch (error) {
      throw new AppError(error, { context: { operation: "currentUser" } });
    }
  }
}

export class DefaultEventsAuth implements EventsAuthApi {
  private users = new CurrentUserService();
  private roles = new ProjectRolesService();

  async currentUser(cookie: string, signal?: AbortSignal) {
    const user = await this.users.getUser(cookie, signal);
    if (!user?.id) throw new AppError("no user in session");
    return { id: String(user.id) };
  }

  async projectRoles(cookie: string, slug: string) {
    return rolesSchema.parse(await this.roles.getRoles(cookie, slug));
  }
}

/** Split requested project ids into granted (role above guest) and denied. */
export const partitionProjects = (requested: string[], roles: Record<string, number>) => {
  const granted: string[] = [];
  const denied: string[] = [];
  for (const id of new Set(requested)) {
    const role = Object.prototype.hasOwnProperty.call(roles, id) ? roles[id] : undefined;
    (role !== undefined && role > GUEST_ROLE ? granted : denied).push(id);
  }
  return { granted, denied };
};

/** True when the error means the session itself is invalid (as opposed to a transient failure). */
export const isSessionGone = (error: unknown): boolean => {
  const status = (error as { statusCode?: number } | null)?.statusCode;
  return status === 401 || status === 403;
};

/**
 * How a failed call should be treated. For the current-user call a 401 or 403 means the session is
 * dead. For the project-roles call only a 401 does: a 403 means no access to that workspace.
 */
export type AuthFailure = "session" | "denied" | "transient";

export const classifyRolesError = (error: unknown): AuthFailure => {
  const status = (error as { statusCode?: number } | null)?.statusCode;
  if (status === 401) return "session";
  if (status === 403) return "denied";
  return "transient";
};
