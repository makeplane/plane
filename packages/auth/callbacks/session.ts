export const session = async ({ session, token }: any) => {
  session.access_token = token?.access_token;
  session.user.id = token?.id;
  return token;
};
