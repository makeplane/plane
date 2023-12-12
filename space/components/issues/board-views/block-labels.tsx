"use client";

export const IssueBlockLabels = ({ labels }: any) => (
  <div className="relative flex flex-wrap items-center gap-1">
    {labels &&
      labels.length > 0 &&
      labels.map((_label: any) => (
        <div
          key={_label?.id}
          className="flex flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm"
        >
          <div className="flex items-center gap-1.5 text-custom-text-200">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `${_label?.color}` }} />
            <div className="text-xs">{_label?.name}</div>
          </div>
        </div>
      ))}
  </div>
);
