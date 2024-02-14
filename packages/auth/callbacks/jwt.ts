export const jwt = ({ token, user }: any) => {
  if (user) {
    token.user = user;
  }
  console.log("JWT CALLBACKS", token);
  return token;
};
