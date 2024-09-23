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
      requestParameters,
      connection,
      // user id used as token for authentication
      token,
    }) => {
      // request headers
      const cookie = requestHeaders.cookie?.toString();
      // params
      const params = requestParameters;

      if (!cookie) {
        throw Error("Credentials not provided");
      }

      try {
        await handleAuthentication({
          connection,
          cookie,
          params,
          token,
        });
      } catch (error) {
        throw Error("Authentication unsuccessful!");
      }
    },
    async onStateless({ payload, document }) {
      if (payload === "lock") {
        document.broadcastStateless("locked");
      }
      if (payload === "unlock") {
        document.broadcastStateless("unlocked");
      }
      if (payload === "archive") {
        document.broadcastStateless("archived");
      }
      if (payload === "unarchive") {
        document.broadcastStateless("unarchived");
      }
    },
    extensions,
    debounce: 10000
  });
};
