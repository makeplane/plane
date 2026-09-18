import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-platform-os", () => ({
  usePlatformOS: () => ({ isMobile: false, platform: "Linux" }),
}));

vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
}));

import { DropdownButton } from "@/components/dropdowns/buttons";

describe("DropdownButton", () => {
  it.each(["border-with-text", "background-with-text", "transparent-with-text"] as const)(
    "renders the %s appearance as presentational content",
    (variant) => {
      const markup = renderToStaticMarkup(
        <button type="button">
          <DropdownButton isActive={false} showTooltip={false} tooltipHeading="State" variant={variant}>
            Todo
          </DropdownButton>
        </button>
      );

      expect(markup.match(/<button/g)).toHaveLength(1);
      expect(markup).toContain("<span");
    }
  );
});
