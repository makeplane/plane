/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Logo as LogoType } from "../types/logo";
import { Logo } from "./logo";

// The material-symbols font never loads in jsdom; emoji, lucide and image logos don't depend on it.
vi.mock("use-font-face-observer", () => ({ default: () => true }));

const imageLogo = (url: string): LogoType => ({ in_use: "image", image: { url } });
const fallback = <span data-testid="fallback" />;

describe("Logo — image", () => {
  it("renders an https image at the requested size, decorative and contained", () => {
    const { container } = render(<Logo logo={imageLogo("https://cdn.example.com/acme.png")} size={20} />);
    const img = container.querySelector("img");

    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://cdn.example.com/acme.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.style.width).toBe("20px");
    expect(img?.style.height).toBe("20px");
    expect(img?.className).toContain("object-contain");
    expect(img?.className).toContain("rounded");
  });

  it("renders a Plane asset path", () => {
    const { container } = render(<Logo logo={imageLogo("/api/assets/v2/static/abc/")} />);

    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/\/api\/assets\/v2\/static\/abc\/$/);
  });

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "//evil.example.com/logo.png",
    "ftp://example.com/logo.png",
    "/static/logo.png",
    "not a url",
  ])("refuses %s and renders the fallback instead", (url) => {
    const { container } = render(<Logo logo={imageLogo(url)} fallback={fallback} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("fallback")).toBeDefined();
  });

  it("swaps to the fallback when the image fails to load, and retries a new URL", () => {
    const { container, rerender } = render(
      <Logo logo={imageLogo("https://cdn.example.com/broken.png")} fallback={fallback} />
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();

    fireEvent.error(img as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("fallback")).toBeDefined();

    rerender(<Logo logo={imageLogo("https://cdn.example.com/fixed.png")} fallback={fallback} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/fixed.png");
  });

  it("keeps a sized placeholder when no fallback is given", () => {
    const { container } = render(<Logo logo={imageLogo("javascript:alert(1)")} size={18} />);
    const placeholder = container.firstElementChild as HTMLElement | null;

    expect(container.querySelector("img")).toBeNull();
    expect(placeholder?.style.width).toBe("18px");
  });
});

describe("Logo — existing kinds are unchanged", () => {
  it("still renders an emoji logo as text", () => {
    render(<Logo logo={{ in_use: "emoji", emoji: { value: "128640" } }} />);

    expect(screen.getByText("🚀")).toBeDefined();
  });

  it("ignores an image field on an emoji logo", () => {
    const { container } = render(
      <Logo logo={{ in_use: "emoji", emoji: { value: "128640" }, image: { url: "https://cdn.example.com/a.png" } }} />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("🚀")).toBeDefined();
  });
});
