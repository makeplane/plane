import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { signIn } from "../callbacks/sign-in";
import { jwt } from "../callbacks/jwt";
import { session } from "../callbacks/session";
import PlaneAuthAdapter from "./adapter";

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

export const getAuthOptions = (res: any, config: TAuthConfig) => ({
  providers: getNextAuthProviders(config),
  adapter: PlaneAuthAdapter(),
  callbacks: {
    signIn,
    jwt,
    async session({ session, token }: any) {
      console.log("SESSION CALLBACKS");
      session.access_token = token?.access_token;
      session.user.id = token?.id;
      // res.setHeader(
      //   "Set-Cookie",
      //   `api_access_token=${token?.access_token}; path=/;`
      // );
      return token;
    },
  },
});
