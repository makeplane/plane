import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
import { UserService } from "@/core/services/user.service";

const validateToken = async (token: string | undefined) => {
  try {
    if (!token) {
      throw new Error("Token not provided");
    }
    const userService = new UserService();
    const response = await userService.currentUser(token);
    return response;
  } catch (error) {
    return null;
  }
};

export const onAuthenticate = () => {
  return async ({ token }: { token: string | undefined }) => {
    const user = await validateToken(token);
    if (!user) {
      throw new Error("Invalid token");
    }
    return user;
  };
};

export const onStateless = () => {
  return async ({ payload, document }: any) => {
    // broadcast the client event (derived from the server event) to all the clients so that they can update their state
    const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer].client;
    if (response) {
      document.broadcastStateless(response);
    }
  };
};

export const handleDataFetch = async (data: any) => {
  try {
    const { context, documentName, requestParameters } = data;
    console.log("handleDataFetch", context);
    console.log("handleDataFetch", documentName);
    console.log("handleDataFetch", requestParameters);
    return documentName; // TODO: remove this once the API integration is done
    // fetch the data using page service
    // const pageService = new PageService();
    // const page = await pageService.getPage(documentName);
    // return page;
  } catch (error) {
    console.error("handleDataFetch", error);
    throw error;
  }
};

export const handleDataStore = async (data: any) => {
  try {
    const { context, documentName, requestParameters } = data;
    console.log("handleDataStore", context);
    console.log("handleDataStore", documentName);
    console.log("handleDataStore", requestParameters);
    return documentName; // TODO: remove this once the API integration is done
    // store the data using page service
    // const pageService = new PageService();
    // const page = await pageService.updatePage(documentName, requestParameters);
    // return page;
  } catch (error) {
    console.error("handleDataStore", error);
    throw error;
  }
};
