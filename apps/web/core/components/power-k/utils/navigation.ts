// plane imports
import { joinUrlPath } from "@plane/utils";
// local imports
import type { TPowerKContext } from "../core/types";

export const handlePowerKNavigate = (context: TPowerKContext, routerSegments: (string | undefined)[]) => {
  const validRouterSegments = routerSegments.filter((segment) => segment !== undefined);

  if (validRouterSegments.length === 0) {
    console.warn("No valid router segments provided", routerSegments);
    return;
  }

  if (validRouterSegments.length !== routerSegments.length) {
    console.warn("Some of the router segments are undefined", routerSegments);
  }

  const route = joinUrlPath(...validRouterSegments);
  context.router.push(route);
};
