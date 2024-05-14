declare module "next-auth" {
  interface Session {
    user: {
      name: string;
      email: string;
      image: string;
      accessToken: string;
      refreshToken: string;
    };
  }
}
