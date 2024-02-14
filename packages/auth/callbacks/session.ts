export const session = async ({ session, token }: any) => {
  console.log("SESSION CALLBACKS", token);
  session.user = token?.user;
  return token;
};
