// cookies
import { convertCookieStringToObject } from "./cookie";
// types
import type { IProjectMember, IUser, IWorkspace, IWorkspaceMember } from "types";

export const requiredAuth = async (cookie?: string) => {
  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  if (!token) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.plane.so";

  let user: IUser | null = null;

  try {
    const data = await fetch(`${baseUrl}/api/users/me/`, {
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

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.plane.so";

  let memberDetail: IProjectMember | null = null;

  try {
    const data = await fetch(
      `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/me/`,
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

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.plane.so";

  let memberDetail: IWorkspaceMember | null = null;

  try {
    const data = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/workspace-members/me/`, {
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
