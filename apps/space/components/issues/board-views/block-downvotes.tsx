"use client";

export const IssueBlockDownVotes = ({ number }: { number: number }) => (
  <div className="h-6 rounded flex px-1.5 pl-1 py-1 items-center border-[0.5px] border-custom-border-300 text-custom-text-300 text-xs">
    <span className="material-symbols-rounded text-base !p-0 !m-0 rotate-180 text-custom-text-300">
      arrow_upward_alt
    </span>
    {number}
  </div>
);
