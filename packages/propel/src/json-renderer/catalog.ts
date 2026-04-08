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

/**
 * Pi Chat json-render Catalog
 *
 * Declares which components and actions the AI is allowed to generate.
 * The catalog is used for:
 *   - AI prompt generation via `piChatCatalog.prompt()`
 *   - Spec validation via `piChatCatalog.validate()`
 *   - Type inference for the registry
 *
 * To add a new component:
 *   1. Create its props schema in `pi-chat-schema.ts`
 *   2. Add the component entry here
 *   3. Implement the React component in `pi-chat-registry.tsx`
 */

// local imports
import { defineCatalog } from "./renderer";
import { barChartPropsSchema, lineChartPropsSchema, pieChartPropsSchema, buttonPropsSchema } from "./schema";

export const piChatCatalog = defineCatalog({
  components: {
    BarChart: {
      props: barChartPropsSchema,
      description:
        "A bar chart. Send `bars` with one item for a simple bar chart, or multiple items with a shared `stackId` for a stacked bar chart.",
    },
    PieChart: {
      props: pieChartPropsSchema,
      description: "A pie/donut chart. Each slice is defined by a `cells` entry keyed to a field in `data`.",
    },
    LineChart: {
      props: lineChartPropsSchema,
      description: "A line chart with one or more data series defined in `lines`.",
    },
    Button: {
      props: buttonPropsSchema,
      description: "A clickable button that triggers an action.",
    },
  },
  actions: {},
});
