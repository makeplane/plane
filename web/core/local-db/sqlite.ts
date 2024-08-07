// import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";
import { createTables } from "./tables";

declare module "@sqlite.org/sqlite-wasm" {
  export function sqlite3Worker1Promiser(...args: any): any;
}

type TSQL = {
  db?: any;
  initialized: boolean;
  syncInProgress: boolean | Promise<any>;
};

const log = console.log;
const error = console.error;

const SQL: TSQL = { initialized: false, syncInProgress: false };
const start = async (sqlite3: any) => {
  log("Running SQLite3 version", sqlite3.version.libVersion);
  SQL.db = new sqlite3.oo1.DB("/mydb.sqlite3", "ct");
  createTables(SQL.db);
};

const initializeSQLite = async () => {
  if (SQL.initialized) {
    console.info("Instance already initialized");
    return;
  }
  try {
    log("Loading and initializing SQLite3 module...");

    const promiser = await new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser),
      });
    });

    log("Done initializing. Running demo...");

    const configResponse = await promiser("config-get", {});
    log("Running SQLite3 version", configResponse.result.version.libVersion);

    const openResponse = await promiser("open", {
      filename: "file:mydb.sqlite3?vfs=opfs",
    });
    const { dbId } = openResponse;
    SQL.db = {
      dbId,
      exec: async (val) => {
        if (typeof val === "string") {
          val = { sql: val };
        }
        return promiser("exec", { dbId, ...val });
      },
    };
    log(
      "OPFS is available, created persisted database at",
      openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, "$1")
    );
    SQL.initialized = true;
    // Your SQLite code here.
    await createTables(SQL.db);
  } catch (err) {
    if (!(err instanceof Error)) {
      err = new Error(err.result.message);
    }
    error(err.name, err.message);
  }
};

// initializeSQLite();

export { SQL, initializeSQLite };
