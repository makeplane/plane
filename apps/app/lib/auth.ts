import { convertCookieStringToObject } from "./cookie";

// types
import type { IUser } from "types";
// constants
import { BASE_STAGING, USER_ENDPOINT } from "constants/api-routes";

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
