import { convertCookieStringToObject } from "./cookie";

// types
import type { IProjectMember, IUser } from "types";
// constants
import { BASE_STAGING, PROJECT_MEMBER_ME, USER_ENDPOINT } from "constants/api-routes";

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

    user = data;
  } catch (err) {
    console.error(err);
    user = null;
  }

  return user;
};

export const requiredAdmin = async (projectId: string, cookie?: string) => {
  const user = await requiredAuth(cookie);

  if (!user) return null;

  const cookies = convertCookieStringToObject(cookie);
  const token = cookies?.accessToken;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || BASE_STAGING;

  let memberDetail: IProjectMember | null = null;

  const workspaceSlug = user.workspace.slug;

  try {
    const data = await fetch(`${baseUrl}${PROJECT_MEMBER_ME(workspaceSlug, projectId)}`, {
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

