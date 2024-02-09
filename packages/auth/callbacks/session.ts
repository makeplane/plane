export const session = async ({ session, token, res }: any) => {
  console.log("SESSION CALLBACKS", res);
  session.access_token = token?.access_token;
  session.user.id = token?.id;
  return token;
};
