import { Server } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
// lib
import { handleAuthentication } from "@/core/lib/authentication.js";
// extensions
import { getExtensions } from "@/core/extensions/index.js";

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
      const { cookie = requestHeaders.cookie?.toString(), id: userId } =
        JSON.parse(token);

      if (!cookie || !userId) {
        throw Error("Credentials not provided");
      }

      // set cookie in context, so it can be used in the server handler.
      context.cookie = cookie;

      try {
        await handleAuthentication({
          cookie,
          token: userId,
        });
      } catch (error) {
        throw Error("Authentication unsuccessful!");
      }
    },
    extensions,
    debounce: 10000,
  });
};
