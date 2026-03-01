/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { EColumnAttributeNames, EColumnListNodeType } from "src/ee/extensions/multi-column/types";

const parseColumnsToTables = (html: string, doc: Document) => {
  const columnLists = doc.querySelectorAll(`[${EColumnAttributeNames.NODE_TYPE}="${EColumnListNodeType.COLUMN_LIST}"]`);

  if (columnLists.length === 0) return html;

  columnLists.forEach((columnList) => {
    const columns = columnList.querySelectorAll(`[${EColumnAttributeNames.NODE_TYPE}="${EColumnListNodeType.COLUMN}"]`);
    const tableId = columnList.getAttribute("data-id");
    const pmSlice = columnList.getAttribute("data-pm-slice") || "";

    const table = doc.createElement("table");
    if (tableId) table.setAttribute("data-id", tableId);
    if (pmSlice) table.setAttribute("data-pm-slice", pmSlice);

    const tbody = doc.createElement("tbody");
    const tr = doc.createElement("tr");

    columns.forEach((column) => {
      const td = doc.createElement("td");
      while (column.firstChild) {
        td.appendChild(column.firstChild);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
    table.appendChild(tbody);
    columnList.replaceWith(table);
  });

  return doc.body.innerHTML;
};

const nodeParseHandlers: {
  match: string;
  handler: (html: string, doc: Document) => string;
}[] = [
  {
    match: 'data-node-type="column-list"',
    handler: parseColumnsToTables,
  },
];

/**
 * Parse the editor HTML to the global HTML
 * @param html - The editor HTML
 * @returns The global HTML
 */
export const parseEditorHTMLtoGlobalHTML = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let modified = false;

  for (const { match, handler } of nodeParseHandlers) {
    if (html.includes(match)) {
      html = handler(html, doc);
      modified = true;
    }
  }

  return modified ? doc.body.innerHTML : html;
};
