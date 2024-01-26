import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { Account, Profile, User } from "next-auth";
import NextAuth from "next-auth/next";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : "";

interface AuthenticatedUser extends User {
  accessToken?: string;
  refreshToken?: string;
}

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

const authHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const configs: TAuthConfig = await axios.get(API_BASE_URL + "/api/auth-configs/").then((res) => res.data);
  return await NextAuth(req, res, {
    providers: [
      GithubProvider({
        clientId: configs?.github?.client_id || "",
        clientSecret: configs?.github?.client_secret || "",
      }),
      GoogleProvider({
        clientId: configs?.google?.client_id || "",
        clientSecret: configs?.google?.client_secret || "",
      }),
    ],
    callbacks: {
      async signIn({ account, profile, user }) {
        if (account?.provider === "google") {
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
            // if (googleResponse?.access_token) {
            //   user.access_token = googleResponse?.access_token;
            //   user.refresh_token = googleResponse?.refresh_token;
            // }
            return true;
          } catch (err) {
            return false;
          }
        }
        if (account?.provider === "github") {
          console.log("account", account);
          console.log("profile", profile);
        }
        return false;
      },
    },
    async session({ session, token, user }) {
      session.accessToken = token?.accessToken;
      session.user.id = token?.id;
      return session;
    },
  });
};

export default authHandler;
