import { Database } from "./database";
import { Logger } from "./logger";
import { Redis } from "./redis";

export const extensions = [new Logger(), new Database(), new Redis()];
