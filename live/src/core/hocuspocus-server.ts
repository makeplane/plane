import { Server } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
// lib
import { handleAuthentication } from "@/core/lib/authentication.js";
// extensions
import { getExtensions } from "@/core/extensions/index.js";
import { TUserDetails } from "@plane/editor";
// types
import { type HocusPocusServerContext } from "@/core/types/common.js";

export const getHocusPocusServer = async () => {
  const extensions = await getExtensions();
  const serverName = process.env.HOSTNAME || uuidv4();
  return Server.configure({
    name: serverName,
    onAuthenticate: async ({
      requestHeaders,
      context,
      // user id used as token for authentication
      token,
    }) => {
      let cookie: string | undefined;
      let userId: string | undefined;

      // Extract cookie (fallback to request headers) and userId from token (for scenarios where
      // the cookies are not passed in the request headers)
      try {
        const parsedToken = JSON.parse(token) as TUserDetails;
        userId = parsedToken.id;
        cookie = parsedToken.cookie;
        if (!cookie) {
          cookie = requestHeaders.cookie?.toString();
        }
      } catch (error) {
        // If token parsing fails, fallback to request headers
        console.error("Token parsing failed, using request headers:", error);
      }

      if (!cookie || !userId) {
        throw new Error("Credentials not provided");
      }

      // set cookie in context, so it can be used throughout the ws connection
      (context as HocusPocusServerContext).cookie = cookie;

      try {
        await handleAuthentication({
          cookie,
          userId,
        });
      } catch (error) {
        throw Error("Authentication unsuccessful!");
      }
    },
    extensions,
    debounce: 10000,
  });
};
