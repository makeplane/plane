import { Database } from "./database";
import { Logger } from "./logger";
import { Redis } from "./redis";

export const getExtensions = () => [new Logger(), new Database(), new Redis()];
