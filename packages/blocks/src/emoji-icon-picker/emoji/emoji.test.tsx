/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmojiRoot } from "./emoji";

const EMOJIS = [
  { emoji: "👍", label: "Thumbs up", category: 0, version: 1, tags: ["thumb"] },
  { emoji: "👎", label: "Thumbs down", category: 0, version: 1, tags: ["thumb"] },
  { emoji: "😀", label: "Grinning face", category: 0, version: 1, tags: ["smile"] },
];

function SearchableEmojiPicker({ onChange }: { onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  return <EmojiRoot searchQuery={query} onSearchQueryChange={setQuery} onChange={onChange} />;
}

describe("emoji result rows", () => {
  beforeEach(() => {
    // Exercise Frimousse's real renderer with a deterministic local data cache, without a CDN request.
    sessionStorage.setItem("frimousse/metadata", JSON.stringify({ emojiVersion: 1, countryFlags: false }));
    localStorage.setItem(
      "frimousse/data/en",
      JSON.stringify({
        data: {
          locale: "en",
          emojis: EMOJIS,
          categories: [{ index: 0, label: "People" }],
          skinTones: {
            light: "Light",
            "medium-light": "Medium light",
            medium: "Medium",
            "medium-dark": "Medium dark",
            dark: "Dark",
          },
        },
        metadata: { emojisEtag: null, messagesEtag: null },
      })
    );
  });

  afterEach(() => {
    sessionStorage.removeItem("frimousse/metadata");
    localStorage.removeItem("frimousse/data/en");
  });

  it("keeps partial search results in fixed columns and preserves keyboard selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableEmojiPicker onChange={onChange} />);

    await screen.findByRole("gridcell", { name: "Grinning face" });
    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.type(search, "thumb");
    await waitFor(() => expect(screen.queryByRole("gridcell", { name: "Grinning face" })).toBeNull());

    const up = screen.getByRole("gridcell", { name: "Thumbs up" });
    const row = up.closest<HTMLElement>("[role='row']");
    expect(row).not.toBeNull();
    expect(within(row!).getAllByRole("gridcell")).toHaveLength(2);
    expect(row!.style.display).toBe("grid");
    expect(row!.style.gridTemplateColumns).toBe("repeat(var(--frimousse-list-columns), 2rem)");
    expect(screen.getByRole("grid").style.getPropertyValue("--frimousse-list-columns")).toBe("8");

    await user.keyboard("{ArrowRight}{Enter}");
    expect(onChange).toHaveBeenCalledWith("👎");
  });
});
