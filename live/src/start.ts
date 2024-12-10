import { Server } from "./server.js";

// Start the worker for taking over the migration jobs

const server = new Server();
server.start();
