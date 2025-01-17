"use client";

import range from "lodash/range";
// ui
import { Loader } from "@plane/ui";

export const QuickLinksWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl gap-2 flex flex-wrap">
    {range(4).map((index) => (
      <Loader.Item key={index} height="56px" width="230px" />
    ))}
  </Loader>
);
