export const jwt = async ({ token, user }: any) => {
  console.log("token", token);
  console.log("user", user);
  if (user?.access_token) {
    token.access_token = user?.access_token;
  }
  if (user?.refresh_token) {
    token.refresh_token = user?.refresh_token;
  }
  return token;
};
