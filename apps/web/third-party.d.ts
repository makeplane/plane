declare module "mammoth" {
  export type MammothResult = {
    value: string;
    messages?: unknown[];
  };

  export type ConvertToHtmlOptions = {
    arrayBuffer: ArrayBuffer;
  };

  export function convertToHtml(options: ConvertToHtmlOptions): Promise<MammothResult>;

  const defaultExport: {
    convertToHtml: typeof convertToHtml;
  };

  export default defaultExport;
}

declare module "xlsx" {
  export type WorkBook = {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };

  export type ReadOptions = {
    type: "array";
    sheetRows?: number;
  };

  export function read(data: ArrayBuffer, options: ReadOptions): WorkBook;

  export const utils: {
    sheet_to_html(sheet: unknown): string;
  };

  const defaultExport: {
    read: typeof read;
    utils: typeof utils;
  };

  export default defaultExport;
}
