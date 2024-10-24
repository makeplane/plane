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
  private tp: Promise<any> | null = null;
  private tpResolver: any;
  async init(dbName: string) {
    if (!dbName || typeof dbName !== "string") {
      throw new Error("Invalid database name");
    }

    try {
      const m = await SQLiteESMFactory();
      this.sqlite3 = SQLite.Factory(m);
      const vfs = await MyVFS.create("plane", m);
      this.sqlite3.vfs_register(vfs, true);
      const db = await this.sqlite3.open_v2(`${dbName}.sqlite3`);
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
    return this.instance.exec(sql);
  }

  async exec(props: string | TQueryProps) {
    if (this.tp && props === "BEGIN;") {
      await this.tp;
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

    if (sql === "BEGIN;") {
      this.tp = new Promise((resolve, reject) => {
        this.tpResolver = { resolve, reject };
      });
    }

    if (sql === "COMMIT;" && this.tp) {
      await this.instance.exec(sql);
      this.tpResolver.resolve();
      this.tp = null;
      return;
    }
    return await this.instance.exec(sql);
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
