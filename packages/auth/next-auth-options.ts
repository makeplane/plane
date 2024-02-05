import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { signIn } from "./sign-in";
import { jwt } from "./jwt";
import { session } from "./session";
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

export const getAuthOptions = (config: TAuthConfig, BASE_URL: string) => ({
  Providers: getNextAuthProviders(config),
  adapter: PlaneAuthAdapter(BASE_URL),
  callbacks: {
    signIn,
    jwt,
    session,
  },
});
