import axios from "axios";
import NextAuth from "next-auth/next";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : "";

type TAuthConfig = {
  google: {
    client_id: string;
    client_secret: string;
  };
  github: {
    client_id: string;
    client_secret: string;
  };
};

const googleSignIn = async ({ user, account }: any) => {
  try {
    console.log("account", user);
    const googleResponse = await axios
      .post(API_BASE_URL + "/api/auth/google/", {
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
    if (googleResponse?.access_token) {
      user.access_token = googleResponse?.access_token;
      user.refresh_token = googleResponse?.refresh_token;
    }
    return true;
  } catch (err) {
    return false;
  }
};

const githubSignIn = async ({ user, account }: any) => {
  try {
    console.log("account", user);
    const githubResponse = await axios
      .post(API_BASE_URL + "/api/auth/github/", {
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
    if (githubResponse?.access_token) {
      user.access_token = githubResponse?.access_token;
      user.refresh_token = githubResponse?.refresh_token;
    }
    return true;
  } catch (err) {
    return false;
  }
};

const authHandler = async (req: any, res: any) => {
  const configs: TAuthConfig = await axios.get(API_BASE_URL + "/api/auth-configs/").then((res) => res.data);

  const providers = [
    GithubProvider({
      clientId: configs?.github?.client_id || "",
      clientSecret: configs?.github?.client_secret || "",
    }),
    GoogleProvider({
      clientId: configs?.google?.client_id || "",
      clientSecret: configs?.google?.client_secret || "",
    }),
  ];

  const callbacks = {
    async signIn({ account, user }: any) {
      if (account?.provider === "google") {
        await googleSignIn({ user, account });
      }
      if (account?.provider === "github") {
        await githubSignIn({ user, account });
      }
      return false;
    },
    async jwt({ token, user }: any) {
      token.access_token = user?.accessToken;
      token.refresh_token = user?.refreshToken;
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token?.accessToken;
      session.user.id = token?.id;
      return session;
    },
  } as any;

  return NextAuth(req, res, {
    providers,
    callbacks,
  });
};

export default authHandler;
