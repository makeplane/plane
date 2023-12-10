"use client";

export const IssueBlockDownVotes = ({ number }: { number: number }) => (
  <div className="flex h-6 items-center rounded border-[0.5px] border-custom-border-300 px-1.5 py-1 pl-1 text-xs text-custom-text-300">
    <span className="material-symbols-rounded !m-0 rotate-180 !p-0 text-base text-custom-text-300">
      arrow_upward_alt
    </span>
    {number}
  </div>
);
