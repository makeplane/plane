import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { signIn } from "../callbacks/sign-in";
import { jwt } from "../callbacks/jwt";
import { session } from "../callbacks/session";
import axios from "axios";

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
  jwt: {
    encode: async ({ token }) => {
      console.log(token);
      console.log("JWT ENCODE", token);
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const { session } = await axios
        .post(BASE_URL + "/api/auth/sessions/", {
          user_id: token?.user?.id || token?.id,
        })
        .then((res) => res.data);
      return session;
    },
    decode: async ({ token }) => {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      return await axios
        .get(BASE_URL + "/api/auth/sessions/" + token + "/")
        .then((res) => res.data);
    },
  },
  callbacks: {
    signIn,
    jwt,
    session,
  },
});
