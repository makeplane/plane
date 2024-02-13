export const session = async ({ session, token }: any) => {
  console.log("SESSION CALLBACKS", token, session);
  session.access_token = token?.access_token;
  session.user.id = token?.id;
  return token;
};
