import axios from "axios";
import NextAuth from "next-auth/next";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();

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

const googleSignIn = ({ user, account }: any) =>
  axios
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
    // CredentialsProvider({
    //   name: "Credentials",
    //   credentials: {
    //     username: { label: "Username", type: "text", placeholder: "jsmith" },
    //     password: { label: "Password", type: "password" },
    //   },
    //   authorize: async (credentials, req) => {
    //     const response: any = await authService.passwordSignIn({
    //       email: credentials?.username || "",
    //       password: credentials?.password || "",
    //     });

    //     if (response?.access_token) {
    //       return { token: response?.access_token };
    //     } else {
    //       return;
    //     }
    //   },
    // }),
  ];

  const callbacks = {
    async signIn({ account, user }: any) {
      if (account?.provider === "google") {
        const { access_token, refresh_token } = await googleSignIn({ user, account });
        user.access_token = access_token;
        user.refresh_token = refresh_token;
        return true;
      }
      if (account?.provider === "github") {
        return await githubSignIn({ user, account });
      }
      return false;
    },
    async jwt({ token, user }: any) {
      console.log("token", token);
      console.log("user", user);
      if (user?.access_token) {
        token.access_token = user?.access_token;
      }
      if (user?.refresh_token) {
        token.refresh_token = user?.refresh_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log("token", token);
      console.log("session", session);
      session.access_token = token?.access_token;
      session.user.id = token?.id;
      return token;
    },
  } as any;

  return NextAuth(req, res, {
    providers,
    callbacks,
  });
};

export default authHandler;
