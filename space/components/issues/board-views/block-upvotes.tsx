"use client";

export const IssueBlockUpVotes = ({ number }: { number: number }) => (
  <div className="flex h-6 items-center rounded border-[0.5px] border-neutral-border-medium px-1.5 py-1 pl-1 text-xs text-neutral-text-medium">
    <span className="material-symbols-rounded !m-0 !p-0 text-base text-neutral-text-medium">arrow_upward_alt</span>
    {number}
  </div>
);
