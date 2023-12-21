import ApiServer from "./server";

const apiServer = new ApiServer();
// starting server
apiServer.start(apiServer.SERVER_PORT);