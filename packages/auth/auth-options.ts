import axios from "axios";
import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const getNextAuthProviders = (configs) => {
  const { github, google } = configs;
  const providers: Provider[] = [];

  if (google.client_id && google.client_secret) {
    providers.push(
      GoogleProvider({
        clientId: google.client_id,
        clientSecret: google.client_secret,
      })
    );
  }

  if (github.client_id && github.client_secret) {
    providers.push(
      GithubProvider({
        clientId: github.client_id,
        clientSecret: github.client_secret,
      })
    );
  }

  return providers;
};

const googleSignIn = async ({ account, user }) => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await axios
    .post(BASE_URL + "/api/auth/google/", {
      provider_account_id: account?.providerAccountId,
      access_token: account?.access_token,
      access_token_expired_at: account?.expires_at,
      meta: {
        id_token: account?.id_token,
      },
      email: user?.email,
      first_name: user?.name,
      avatar: user.image,
    })
    .then((res) => res.data);
  return response;
};

const githubSignIn = async ({ account, user }) => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  try {
    const response = await axios
      .post(BASE_URL + "/api/auth/github/", {
        provider_account_id: account?.providerAccountId,
        access_token: account?.access_token,
        access_token_expired_at: account?.expires_at,
        meta: {
          id_token: account?.id_token,
        },
        email: user?.email,
        first_name: user?.name,
        avatar: user.image,
      })
      .then((res) => res.data);
    return response;
  } catch (err) {
    return false;
  }
};

const signIn = async ({ account, user }) => {
  if (account.provider === "google") {
    const { access_token, refresh_token } = await googleSignIn({
      account,
      user,
    });
    user.access_token = access_token;
    user.refresh_token = refresh_token;
    return true;
  }
  if (account.provider === "github") {
    const { access_token, refresh_token } = await githubSignIn({
      account,
      user,
    });
    user.access_token = access_token;
    user.refresh_token = refresh_token;
    return true;
  }
  return false;
};
