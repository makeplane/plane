// plane imports
import { joinUrlPath } from "@plane/utils";
// local imports
import { TPowerKContext } from "../core/types";

export const handlePowerKNavigate = (
  context: TPowerKContext,
  routerSegments: (string | undefined)[],
  shouldClosePalette: boolean = true
) => {
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

  // Close the palette if requested
  if (shouldClosePalette) {
    context.closePalette();
  }
};
