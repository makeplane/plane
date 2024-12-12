import { ILogger } from 'index';

let Logger: ILogger;

if (typeof window !== "undefined") {
  // Client-side logic
  console.log("inside client logger import");
  const { default: ClientLogger } = require('./client-logger');
  Logger = ClientLogger;
} else {
  // Server-side logic
  const { default: ServerLogger } = require('./server-logger');
  Logger = ServerLogger;
}

export default Logger;
