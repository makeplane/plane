import { IApiToken } from "types/api_token";
import { renderDateFormat } from "./date-time.helper";

export const csvDownload = (rows: Array<Array<string>>, name: string) => {

  let csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${name}.csv`);
  document.body.appendChild(link);
  link.click();
};
