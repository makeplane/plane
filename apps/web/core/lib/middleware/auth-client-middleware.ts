/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";
// plane imports
import type { TUserProfile } from "@plane/types";
// lib
import { bootstrapAuth } from "@/lib/bootstrap/client-bootstrap";
import { store } from "@/lib/store-context";

const buildLoginRedirect = (pathname: string) => `/${pathname ? `?next_path=${pathname}` : ``}`;

const getRequestData = (request: Request) => {
  const url = new URL(request.url);
  return {
    pathname: url.pathname,
    nextPath: url.searchParams.get("next_path"),
  };
};

const getAuthState = () => {
  const currentUser = store.user.data;
  const currentUserProfile = store.user.userProfile.data;

  return {
    currentUser,
    hasCurrentUser: Boolean(currentUser?.id),
    hasCurrentUserProfile: Boolean(currentUserProfile?.id),
    userOnboarded: isUserOnboarded(currentUserProfile),
  };
};

export const isSafeNextPath = (url: string): boolean => !/^(https?|ftp):\/\//i.test(url);

export const isUserOnboarded = (profile: TUserProfile | undefined): boolean =>
  Boolean(
    profile?.is_onboarded ||
    (profile?.onboarding_step?.profile_complete &&
      profile?.onboarding_step?.workspace_create &&
      profile?.onboarding_step?.workspace_invite &&
      profile?.onboarding_step?.workspace_join)
  );

export const resolveWorkspaceRedirect = ({
  nextPath,
  isFirstTimeOnboarding = false,
}: {
  nextPath?: string | null;
  isFirstTimeOnboarding?: boolean;
}) => {
  let redirectionRoute = "/create-workspace";

  if (nextPath && isSafeNextPath(nextPath)) return nextPath;

  const workspaces = store.workspaceRoot.workspaces;
  const preferredWorkspaceSlug = store.user.preferredWorkspaceSlug;

  if (
    preferredWorkspaceSlug &&
    Object.values(workspaces ?? {}).some((workspace) => workspace.slug === preferredWorkspaceSlug)
  ) {
    redirectionRoute = isFirstTimeOnboarding ? `/${preferredWorkspaceSlug}/get-started` : `/${preferredWorkspaceSlug}`;
  }

  return redirectionRoute;
};

export const requireAuthenticatedUser: MiddlewareFunction = async ({ request }, next) => {
  await bootstrapAuth();

  const { pathname } = getRequestData(request);
  const { hasCurrentUser } = getAuthState();

  if (!hasCurrentUser) {
    throw redirect(buildLoginRedirect(pathname));
  }

  await next();
};

export const redirectIfUserIsAuthenticated: MiddlewareFunction = async ({ request }, next) => {
  await bootstrapAuth();

  const { nextPath } = getRequestData(request);
  const { hasCurrentUser, hasCurrentUserProfile, userOnboarded } = getAuthState();

  if (!hasCurrentUser) {
    await next();
    return;
  }

  if (hasCurrentUserProfile && userOnboarded) {
    throw redirect(resolveWorkspaceRedirect({ nextPath }));
  }

  throw redirect("/onboarding");
};

export const redirectIfUserIsOnboarded: MiddlewareFunction = async ({ request }, next) => {
  const { pathname, nextPath } = getRequestData(request);
  const { hasCurrentUser, hasCurrentUserProfile, userOnboarded } = getAuthState();

  if (!hasCurrentUser) {
    throw redirect(buildLoginRedirect(pathname));
  }

  if (hasCurrentUserProfile && userOnboarded) {
    throw redirect(resolveWorkspaceRedirect({ nextPath }));
  }

  await next();
};

export const redirectIfUserIsNotOnboarded: MiddlewareFunction = async ({ request }, next) => {
  const { pathname } = getRequestData(request);
  const { hasCurrentUser, hasCurrentUserProfile, userOnboarded } = getAuthState();

  if (!hasCurrentUser) {
    throw redirect(buildLoginRedirect(pathname));
  }

  if (!hasCurrentUserProfile || !userOnboarded) {
    throw redirect("/onboarding");
  }

  await next();
};

export const redirectIfPasswordAlreadySet: MiddlewareFunction = async ({ request }, next) => {
  const { pathname, nextPath } = getRequestData(request);
  const { currentUser, hasCurrentUser, hasCurrentUserProfile, userOnboarded } = getAuthState();

  if (!hasCurrentUser) {
    throw redirect(buildLoginRedirect(pathname));
  }

  if (!currentUser?.is_password_autoset && hasCurrentUserProfile && userOnboarded) {
    throw redirect(resolveWorkspaceRedirect({ nextPath }));
  }

  await next();
};
