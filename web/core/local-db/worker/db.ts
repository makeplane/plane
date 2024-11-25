import * as Comlink from "comlink";
import { OPFSCoopSyncVFS as MyVFS } from "./wa-sqlite/src/OPFSCoopSyncVFS";
import * as SQLite from "./wa-sqlite/src/sqlite-api";
import SQLiteESMFactory from "./wa-sqlite/src/wa-sqlite.mjs";

type TQueryProps = {
  sql: string;
  rowMode: string;
  returnValue: string;
  bind: any[];
};
const mergeToObject = (columns: string[], row: any[]) => {
  const obj: any = {};
  columns.forEach((column, index) => {
    obj[column] = row[index];
  });
  return obj;
};
interface SQLiteInstance {
  db: unknown;
  exec: (sql: string) => Promise<unknown[]>;
}

export class DBClass {
  private instance: SQLiteInstance = {} as SQLiteInstance;
  private sqlite3: any;
  private tp: Promise<any>[] = [];
  private tpResolver: any = [];
  async init(dbName: string) {
    if (!dbName || typeof dbName !== "string") {
      throw new Error("Invalid database name");
    }

    try {
      const m = await SQLiteESMFactory();
      this.sqlite3 = SQLite.Factory(m);
      const vfs = await MyVFS.create("plane", m);
      this.sqlite3.vfs_register(vfs, true);
      // Fallback in rare cases where the database is not initialized in time
      const p = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
      const dbPromise = this.sqlite3.open_v2(
        `${dbName}.sqlite3`,
        this.sqlite3.OPEN_READWRITE | this.sqlite3.OPEN_CREATE,
        "plane"
      );

      const db = await Promise.any([dbPromise, p]);

      if (!db) {
        throw new Error("Failed to initialize in time");
      }

      this.instance.db = db;
      this.instance.exec = async (sql: string) => {
        const rows: any[] = [];
        await this.sqlite3.exec(db, sql, (row: any[], columns: string[]) => {
          rows.push(mergeToObject(columns, row));
        });

        return rows;
      };
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize database: ${(error as any)?.message}`);
    }
  }

  runQuery(sql: string) {
    return this.instance?.exec?.(sql);
  }

  async exec(props: string | TQueryProps) {
    // @todo this will fail if the transaction is started any other way
    // eg:  BEGIN, OR BEGIN TRANSACTION
    if (props === "BEGIN;") {
      let promiseToAwait;
      if (this.tp.length > 0) {
        promiseToAwait = this.tp.shift();
      }
      const p = new Promise((resolve, reject) => {
        this.tpResolver.push({ resolve, reject });
      });
      this.tp.push(p);

      if (promiseToAwait) {
        await promiseToAwait;
      }
    }
    let sql: string, bind: any[];
    if (typeof props === "string") {
      sql = props;
    } else {
      ({ sql, bind } = props);
      if (bind) {
        for await (const stmt of this.sqlite3.statements(this.instance.db, sql)) {
          bind.forEach((b, i) => {
            this.sqlite3.bind(stmt, i + 1, b);
          });

          const rows = [];

          do {
            const columns = await this.sqlite3.column_names(stmt);
            const row = await this.sqlite3.row(stmt);
            rows.push(mergeToObject(columns, row));
          } while ((await this.sqlite3.step(stmt)) === SQLite.SQLITE_ROW);

          return rows;
        }
      }
    }

    if (sql === "COMMIT;" && this.tp) {
      await this.instance?.exec?.(sql);
      if (this.tp.length > 0) {
        const { resolve } = this.tpResolver.shift();
        resolve();
      }
      return;
    }
    return await this.instance?.exec?.(sql);
  }
  async close() {
    try {
      if (!this.instance.db) {
        return;
      }
      await this.sqlite3.close(this.instance.db);
      // Clear instance to prevent usage after closing
      this.instance = {} as SQLiteInstance;
    } catch (error) {
      throw new Error(`Failed to close database: ${(error as any)?.message}`);
    }
  }
}
Comlink.expose(DBClass);
