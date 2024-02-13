import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { signIn } from "../callbacks/sign-in"
import { JWT } from "next-auth/jwt"

export type TAuthConfig = {
  google: {
    client_id: string;
    client_secret: string;
  };
  github: {
    client_id: string;
    client_secret: string;
  };
};

const getNextAuthProviders = (configs: TAuthConfig) => {
  const { github, google } = configs;
  const providers: Provider[] = [];

  if (google?.client_id && google?.client_secret) {
    providers.push(
      GoogleProvider({
        clientId: google.client_id,
        clientSecret: google.client_secret,
      })
    );
  }

  if (github?.client_id && github?.client_secret) {
    providers.push(
      GithubProvider({
        clientId: github.client_id,
        clientSecret: github.client_secret,
      })
    );
  }

  return providers;
};

export const getAuthOptions = (config: TAuthConfig) => ({
  providers: getNextAuthProviders(config),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // signIn,
    signIn,
    // jwt
    async jwt({ token, user }: any) {
      if (user?.access_token) {
        token.access_token = user?.access_token;
      }
      if (user?.refresh_token) {
        token.refresh_token = user?.refresh_token;
      }
      return token;
    },
    // session,
    async session({ session, token }: any) {
      if (token?.access_token) {
        session.user.access_token = token?.access_token;
      }
      return Promise.resolve(session);
    },
  },
});
