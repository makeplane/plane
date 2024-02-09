import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const getNewAccessToken = async (refresh_token: string) =>
  await axios
    .post(BASE_URL + "/api/token/verify/", {
      refresh: refresh_token,
    })
    .then((response) => response.data);

export const jwt = async ({ token, user }: any) => {
  console.log("JWT CALLBACKS", user);
  if (user?.access_token) {
    token.access_token = user?.access_token;
  }
  if (user?.refresh_token) {
    token.refresh_token = user?.refresh_token;
  }
  return token;
};
