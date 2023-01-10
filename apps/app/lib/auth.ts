import { convertCookieStringToObject } from "./cookie";

// types
import type { IProjectMember, IUser, IWorkspace, IWorkspaceMember } from "types";
// constants
import {
  BASE_STAGING,
  PROJECT_MEMBER_ME,
  USER_ENDPOINT,
  USER_WORKSPACES,
  USER_WORKSPACE_INVITATIONS,
  WORKSPACE_MEMBER_ME,
} from "constants/api-routes";

export const requiredAuth = async (cookie?: string) => {
  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  if (!token) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || BASE_STAGING;

  let user: IUser | null = null;

  try {
    const data = await fetch(`${baseUrl}${USER_ENDPOINT}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => data);

    user = data.user;
  } catch (err) {
    console.error(err);
    user = null;
  }

  return user;
};

export const requiredAdmin = async (workspaceSlug: string, projectId: string, cookie?: string) => {
  const user = await requiredAuth(cookie);

  if (!user) return null;

  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || BASE_STAGING;

  let memberDetail: IProjectMember | null = null;

  try {
    const data = await fetch(`${baseUrl}${PROJECT_MEMBER_ME(workspaceSlug, projectId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => data);

    memberDetail = data;
  } catch (err) {
    console.error(err);
    memberDetail = null;
  }

  return memberDetail || null;
};

export const requiredWorkspaceAdmin = async (workspaceSlug: string, cookie?: string) => {
  const user = await requiredAuth(cookie);

  if (!user) return null;

  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || BASE_STAGING;

  let memberDetail: IWorkspaceMember | null = null;

  try {
    const data = await fetch(`${baseUrl}${WORKSPACE_MEMBER_ME(workspaceSlug)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => data);

    memberDetail = data;
  } catch (err) {
    console.error(err);
    memberDetail = null;
  }

  return memberDetail || null;
};

export const homePageRedirect = async (cookie?: string) => {
  const user = await requiredAuth(cookie);

  if (!user)
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };

  // FIXME: backend is returning object of user and workspace.
  // Get KT if it's required to send user and workspace and if
  // yes change below accordingly
  if (!user.is_onboarded)
    return {
      redirect: {
        destination: "/onboarding",
        permanent: false,
      },
    };

  let workspaces: IWorkspace[] = [];

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || BASE_STAGING;

  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  try {
    const data = await fetch(`${baseUrl}${USER_WORKSPACES}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => data);

    workspaces = data;
  } catch (e) {
    console.error(e);
    return {
      redirect: {
        destination: "/error",
        permanent: false,
      },
    };
  }

  const lastActiveWorkspace = workspaces.find(
    (workspace) => workspace.id === user.last_workspace_id
  );

  if (lastActiveWorkspace) {
    return {
      redirect: {
        destination: `/${lastActiveWorkspace.slug}`,
        permanent: false,
      },
    };
  } else if (workspaces.length > 0) {
    return {
      redirect: {
        destination: `/${workspaces[0].slug}`,
        permanent: false,
      },
    };
  }

  const invitations = await fetch(`${baseUrl}${USER_WORKSPACE_INVITATIONS}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => data)
    .catch((e) => {
      console.error(e);
      return {
        redirect: {
          destination: "/error",
          permanent: false,
        },
      };
    });

  if (invitations.length > 0)
    return {
      redirect: {
        destination: "/invitations",
        permanent: false,
      },
    };
  else {
    return {
      redirect: {
        destination: "/create-workspace",
        permanent: false,
      },
    };
  }
};
