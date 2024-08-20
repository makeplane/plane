// import { SQL } from "./sqlite";

import { persistence } from "../storage.sqlite";

export const runQuery = async (sql: string) => {
  const data = await persistence.db.exec({
    sql,
    rowMode: "object",
    returnValue: "resultRows",
  });

  return data.result.resultRows;
};
