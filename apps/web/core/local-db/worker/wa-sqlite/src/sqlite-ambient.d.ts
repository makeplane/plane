declare module "./wa-sqlite/src/OPFSCoopSyncVFS" {
  export const OPFSCoopSyncVFS: any;
}

declare module "./wa-sqlite/src/sqlite-api" {
  export const SQLITE_ROW: any;
  export const Factory: any;
}

declare module "./wa-sqlite/src/wa-sqlite.mjs" {
  const SQLiteESMFactory: any;
  export default SQLiteESMFactory;
}
