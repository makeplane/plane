// cookies
import { convertCookieStringToObject } from "./cookie";
// types
import type { IProjectMember, IUser, IWorkspace, IWorkspaceMember } from "types";
// helper
import { API_BASE_URL } from "helpers/common.helper";

export const requiredAuth = async (cookie?: string) => {
  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  if (!token) return null;

  let user: IUser | null = null;

  try {
    const data = await fetch(`${API_BASE_URL}/api/users/me/`, {
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

  let memberDetail: IProjectMember | null = null;

  try {
    const data = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/me/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
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

  let memberDetail: IWorkspaceMember | null = null;

  try {
    const data = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/workspace-members/me/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
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
        destination: "/",
        permanent: false,
      },
    };

  if (!user.is_onboarded)
    return {
      redirect: {
        destination: "/onboarding",
        permanent: false,
      },
    };

  let workspaces: IWorkspace[] = [];

  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  try {
    const data = await fetch(`${API_BASE_URL}/api/users/me/workspaces/`, {
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

  const invitations = await fetch(`${API_BASE_URL}/api/users/me/invitations/workspaces/`, {
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
