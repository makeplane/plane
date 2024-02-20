import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
// auth
// import { getNextAuthOptions } from "@plane/lib";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // const authOptions = getAuthOptions(req, res);
  // Do whatever you want here, before the request is passed down to `NextAuth`
  return await NextAuth(req, res, authOptions);
}
