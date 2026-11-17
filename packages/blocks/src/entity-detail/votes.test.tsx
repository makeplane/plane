/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EntityDetailVotesProps } from "./votes";
import { EntityDetailVotes } from "./votes";
import type { EntityDetailVotesModalProps } from "./votes-modal";
import { EntityDetailVotesModal } from "./votes-modal";

const voteLabels = {
  upVoteLabel: "Upvote",
  downVoteLabel: "Downvote",
  viewUpVotesLabel: "View upvotes",
  viewDownVotesLabel: "View downvotes",
};

function renderVotes(props: Partial<EntityDetailVotesProps> = {}) {
  const handlers = { onUpVote: vi.fn(), onDownVote: vi.fn(), onCountClick: vi.fn() };
  render(
    <EntityDetailVotes
      upVotesCount={3}
      downVotesCount={1}
      isUpVotedByUser
      isDownVotedByUser={false}
      {...voteLabels}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe("EntityDetailVotes", () => {
  it("exposes each toggle's pressed state and names each count with its value", () => {
    renderVotes();

    expect(screen.getByRole("button", { name: "Upvote" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Downvote" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "View upvotes, 3" }).textContent).toBe("3");
    expect(screen.getByRole("button", { name: "View downvotes, 1" }).textContent).toBe("1");
  });

  it("votes from the toggles and opens the voter list from the counts", async () => {
    const user = userEvent.setup();
    const { onUpVote, onDownVote, onCountClick } = renderVotes();

    await user.click(screen.getByRole("button", { name: "Upvote" }));
    await user.click(screen.getByRole("button", { name: "Downvote" }));
    await user.click(screen.getByRole("button", { name: "View downvotes, 1" }));

    expect(onUpVote).toHaveBeenCalledOnce();
    expect(onDownVote).toHaveBeenCalledOnce();
    expect(onCountClick).toHaveBeenCalledWith("downvotes");
  });

  it("blocks voting but keeps the counts usable while disabled", async () => {
    const user = userEvent.setup();
    const { onUpVote, onCountClick } = renderVotes({ disabled: true });

    const upVote = screen.getByRole("button", { name: "Upvote" }) as HTMLButtonElement;
    expect(upVote.disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "View upvotes, 3" }));

    expect(onUpVote).not.toHaveBeenCalled();
    expect(onCountClick).toHaveBeenCalledWith("upvotes");
  });
});

const modalProps: EntityDetailVotesModalProps = {
  isOpen: true,
  onClose: () => {},
  upVoters: [
    { id: "1", displayName: "Ada" },
    { id: "2", displayName: "Grace" },
  ],
  downVoters: [],
  title: "Votes",
  upVotesTabLabel: "2 upvotes",
  downVotesTabLabel: "0 downvotes",
  emptyUpVotesMessage: "No upvotes yet",
  emptyDownVotesMessage: "No downvotes yet",
  closeLabel: "Close",
};

describe("EntityDetailVotesModal", () => {
  it("lists the voters of the initial tab and shows an empty state on the other", async () => {
    const user = userEvent.setup();
    render(<EntityDetailVotesModal {...modalProps} />);

    expect(await screen.findByRole("dialog", { name: "Votes" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "2 upvotes" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Grace")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "0 downvotes" }));
    expect(screen.getByText("No downvotes yet")).toBeTruthy();
  });

  it("opens on the requested tab", async () => {
    render(<EntityDetailVotesModal {...modalProps} initialTab="downvotes" />);

    expect((await screen.findByRole("tab", { name: "0 downvotes" })).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("No downvotes yet")).toBeTruthy();
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EntityDetailVotesModal {...modalProps} onClose={onClose} />);

    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
